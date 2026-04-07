<?php

namespace App\Services;

use App\Exports\ActivePersonnelExport;
use App\Models\ActivePersonnel;
use App\Models\Census;
use App\Models\FamilyMember;
use Carbon\Carbon;
use Exception;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\ValidationException;
use Maatwebsite\Excel\Facades\Excel;

class ActivePersonnelService
{
    public function downloadTemplate()
    {
        return Excel::download(new ActivePersonnelExport, 'plantilla_personal_activo.xlsx');
    }

    public function importExcel($request)
    {
        $validator = Validator::make($request->all(), [
            'file' => 'required|file|mimes:xlsx,xls,csv'
        ]);

        if ($validator->fails()) {
            throw new ValidationException($validator);
        }

        $file = $request->file('file');
        $data = Excel::toArray([], $file);

        if (empty($data[0])) {
            throw new Exception('El archivo está vacío');
        }

        $rows = array_slice($data[0], 1); // Omitir cabecera

        $inserted = 0;
        $errors = [];
        $userID = Auth::id();

        foreach ($rows as $index => $row) {
            try {
                if (empty($row[1]) || empty($row[2])) {
                    continue; // Saltar si no hay cédula o nombre
                }

                // Índices basados en ActivePersonnelExport:
                // 0: NAC, 1: CI, 2: NOMBRE, 3: FECHA NAC, 4: SEXO, 5: E.CIVIL,
                // 6: GRADO, 7: POSTGRADO, 8: DIRECCION, 9: EMAIL, 10: MOVIL, 11: FIJO,
                // 12: CAMISA, 13: PANTALON, 14: ZAPATOS, 15: ASIC, 16: DEP, 17: UNIDAD,
                // 18: DEPT, 19: SERV, 20: F.INGRESO, 21: CARGO, 22: RELACION,
                // 23: COD.NOMINA, 24: NOM.NOMINA

                $asic = null;
                if (!empty($row[15])) {
                    $asic = \App\Models\ASIC::where('name', 'LIKE', "%{$row[15]}%")->first();
                }

                $dependency = null;
                if ($asic && !empty($row[16])) {
                    $dependency = \App\Models\Dependency::where('asic_id', $asic->id)
                        ->where('name', 'LIKE', "%{$row[16]}%")
                        ->first();

                    if (!$dependency) {
                        $dependency = \App\Models\Dependency::create([
                            'asic_id' => $asic->id,
                            'name' => $row[16]
                        ]);
                    }
                }

                $unit = null;
                if ($dependency && !empty($row[17])) {
                    $unit = \App\Models\AdministrativeUnit::where('dependency_id', $dependency->id)
                        ->where('name', 'LIKE', "%{$row[17]}%")
                        ->first();

                    if (!$unit) {
                        $unit = \App\Models\AdministrativeUnit::create([
                            'dependency_id' => $dependency->id,
                            'name' => $row[17]
                        ]);
                    }
                }

                $dept = null;
                if ($unit && !empty($row[18])) {
                    $dept = \App\Models\Department::where('administrative_unit_id', $unit->id)
                        ->where('name', 'LIKE', "%{$row[18]}%")
                        ->first();

                    if (!$dept) {
                        $dept = \App\Models\Department::create([
                            'administrative_unit_id' => $unit->id,
                            'name' => $row[18]
                        ]);
                    }
                }

                $service = null;
                if ($dept && !empty($row[19])) {
                    $service = \App\Models\Service::where('department_id', $dept->id)
                        ->where('name', 'LIKE', "%{$row[19]}%")
                        ->first();

                    if (!$service) {
                        $service = \App\Models\Service::create([
                            'department_id' => $dept->id,
                            'name' => $row[19]
                        ]);
                    }
                }

                ActivePersonnel::updateOrCreate(
                    ['ci' => $row[1]],
                    [
                        'nac' => $row[0] ?: 'V',
                        'full_name' => $row[2],
                        'date_birth' => $this->formatDate($row[3]),
                        'sex' => $this->formatSex($row[4]),
                        'civil_status' => $row[5],
                        'degree_obtained' => $row[6],
                        'postgraduate_degree' => $row[7],
                        'home_address' => $row[8],
                        'email' => $row[9],
                        'mobile_phone' => $row[10],
                        'fixed_phone' => $row[11],
                        'shirt_size' => $row[12],
                        'pant_size' => $row[13],
                        'shoe_size' => $row[14],
                        'asic_id' => $asic ? $asic->id : null,
                        'dependency_id' => $dependency ? $dependency->id : null,
                        'administrative_unit_id' => $unit ? $unit->id : null,
                        'department_id' => $dept ? $dept->id : null,
                        'service_id' => $service ? $service->id : null,
                        'entry_date' => $this->formatDate($row[20]),
                        'job_title' => $row[21],
                        'labor_relationship' => $row[22],
                        'payroll_code' => $row[23],
                        'payroll_name' => $row[24],
                        'user_id' => $userID,
                        'status' => true
                    ]
                );

                $inserted++;
            } catch (\Exception $e) {
                $errors[] = "Fila " . ($index + 2) . ": " . $e->getMessage();
            }
        }

        return [
            'inserted' => $inserted,
            'errors' => $errors
        ];
    }

    private function formatDate($date)
    {
        if (empty($date)) return null;
        try {
            if (is_numeric($date)) {
                $unixDate = ($date - 25569) * 86400;
                return date('Y-m-d', $unixDate);
            }
            return date('Y-m-d', strtotime($date));
        } catch (\Exception $e) {
            return null;
        }
    }

    private function formatSex($sex)
    {
        if (empty($sex)) return 'M';
        $sex = strtoupper(trim($sex));
        return (str_starts_with($sex, 'F') || str_starts_with($sex, 'M')) ? substr($sex, 0, 1) : 'M';
    }

    public function get($params = [])
    {
        $query = ActivePersonnel::query()->with(['asic', 'dependency', 'administrativeUnit', 'department', 'service', 'familyMembers', 'censuses']);

        if (!empty($params['search'])) {
            $search = $params['search'];
            $query->where(function ($q) use ($search) {
                $q->where('ci', 'LIKE', "%{$search}%")
                    ->orWhere('full_name', 'LIKE', "%{$search}%")
                    ->orWhere('email', 'LIKE', "%{$search}%");
            });
        }

        if (!empty($params['filters'])) {
            $filters = is_string($params['filters']) ? json_decode($params['filters'], true) : $params['filters'];

            foreach (['ci', 'full_name', 'email', 'status', 'asic_id', 'dependency_id'] as $field) {
                if (isset($filters[$field])) {
                    $query->where($field, $filters[$field]);
                }
            }
        }

        $perPage = $params['per_page'] ?? 15;
        return $query->orderBy('id', 'desc')->paginate($perPage);
    }

    public function store($data, $photo = null, $idCardPhoto = null)
    {
        return DB::transaction(function () use ($data, $photo, $idCardPhoto) {
            $userID = Auth::id();
            $data['user_id'] = $userID;

            if ($photo) {
                $data['photo'] = $photo->store('active_personnel/photos', 'public');
            }

            if ($idCardPhoto) {
                $data['id_card_photo'] = $idCardPhoto->store('active_personnel/id_cards', 'public');
            }

            $familyMembers = $data['family_members'] ?? [];
            unset($data['family_members']);

            $personnel = ActivePersonnel::create($data);

            foreach ($familyMembers as $member) {
                $personnel->familyMembers()->create($member);
            }

            if (isset($data['to_census']) && $data['to_census']) {
                $census = Census::create([
                    'active_personnel_id' => $personnel->id,
                    'status' => true,
                    'expiration_date' => Carbon::now()->endOfYear()->format('Y-m-d'),
                    'user_id' => $userID,
                    'data' => $personnel->load('asic', 'dependency', 'administrativeUnit', 'department', 'service', 'familyMembers')
                ]);
                $personnel->update(['latest_census_id' => $census->id]);
            }

            return $personnel->load('familyMembers');
        });
    }

    public function update($data, ActivePersonnel $personnel)
    {
        return DB::transaction(function () use ($data, $personnel) {
            $userID = Auth::id();
            $familyMembers = $data['family_members'] ?? [];
            unset($data['family_members']);

            $personnel->update($data);

            Log::info('Actualizando personal activo', [
                'personnel_id' => $personnel->id,
                'updated_data' => $data,
                'family_members_count' => count($familyMembers),
                'personnel_data' => $personnel->toArray()
            ]);

            if (!empty($familyMembers)) {
                $personnel->familyMembers()->delete();
                foreach ($familyMembers as $member) {
                    $personnel->familyMembers()->create($member);
                }
            }

            if (isset($data['to_census']) && $data['to_census']) {
                // Actualizamos el status de los demas censos
                Census::where('active_personnel_id', $personnel->id)->update(['status' => false]);

                $census = Census::create([
                    'active_personnel_id' => $personnel->id,
                    'status' => true,
                    'expiration_date' => Carbon::now()->endOfYear()->format('Y-m-d'),
                    'user_id' => $userID,
                    'data' => $personnel->load('asic', 'dependency', 'administrativeUnit', 'department', 'service', 'familyMembers')
                ]);
                $personnel->update(['latest_census_id' => $census->id]);
            }

            return $personnel->load('familyMembers');
        });
    }

    public function updatePhotos(ActivePersonnel $personnel, $photo = null, $idCardPhoto = null)
    {
        return DB::transaction(function () use ($personnel, $photo, $idCardPhoto) {
            if ($photo) {
                if ($personnel->photo && \Illuminate\Support\Facades\Storage::disk('public')->exists($personnel->photo)) {
                    \Illuminate\Support\Facades\Storage::disk('public')->delete($personnel->photo);
                }
                $personnel->photo = $photo->store('active_personnel/photos', 'public');
            }

            if ($idCardPhoto) {
                if ($personnel->id_card_photo && \Illuminate\Support\Facades\Storage::disk('public')->exists($personnel->id_card_photo)) {
                    \Illuminate\Support\Facades\Storage::disk('public')->delete($personnel->id_card_photo);
                }
                $personnel->id_card_photo = $idCardPhoto->store('active_personnel/id_cards', 'public');
            }

            $personnel->save();

            return $personnel;
        });
    }

    public function destroy(ActivePersonnel $personnel)
    {
        return $personnel->delete();
    }
}
