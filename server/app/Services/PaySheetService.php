<?php

namespace App\Services;

use Exception;
use Carbon\Carbon;
use App\Models\Census;
use App\Models\Activity;
use App\Models\PaySheet;
use App\Enums\ActivityEnum;
use App\Models\TypePaySheet;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Auth;
use Maatwebsite\Excel\Facades\Excel;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\ValidationException;

class PaySheetService
{

    public function get($params = [])
    {
        $query = PaySheet::query()->with('typePaySheet', 'latestCensus.user', 'administrativeLocation');

        if (!empty($params['search'])) {
            $search = $params['search'];
            $query->where(function ($q) use ($search) {
                $q->where('ci', 'LIKE', "%{$search}%")
                    ->orWhere('full_name', 'LIKE', "%{$search}%")
                    ->orWhereHas('typePaySheet', function ($subQuery) use ($search) {
                        $subQuery->where('name', 'LIKE', "%{$search}%")
                            ->orWhere('code', 'LIKE', "%{$search}%");
                    });
            });
        }

        if (!empty($params['filters'])) {
            $filters = json_decode($params['filters'], true);

            if (isset($filters['latest_census.status'])) {
                $filter = $filters['latest_census.status'];

                if ($filter == 'CENSADO') {
                    $query->whereHas('latestCensus', fn($q) => $q->where('status', true));
                } else {
                    $query->whereDoesntHave('latestCensus')
                        ->orWhereHas('latestCensus', fn($q) => $q->where('status', false));
                }
            }

            if (isset($filters['ci'])) {
                $filter = $filters['ci'];
                $query->where('ci', 'LIKE', "%{$filter}%");
            }

            if (isset($filters['full_name'])) {
                $filter = $filters['full_name'];
                $query->where('full_name', 'LIKE', "%{$filter}%");
            }

            if (isset($filters['id'])) {
                $filter = $filters['id'];
                $query->where('id', 'LIKE', "%{$filter}%");
            }

            if (isset($filters['phone_number'])) {
                $filter = $filters['phone_number'];
                $query->where('phone_number', 'LIKE', "%{$filter}%");
            }

            if (isset($filters['city'])) {
                $filter = $filters['city'];
                $query->where('city', $filter);
            }

            if (isset($filters['sex'])) {
                $filter = $filters['sex'];
                $query->where('sex', $filter);
            }

            if (isset($filters['pay_sheet.type_pension'])) {
                $filter = $filters['pay_sheet.type_pension'];
                $query->whereHas('typePaySheet', function ($subQuery) use ($filter) {
                    $subQuery->where('id', $filter);
                });
            }
        }

        $sortField = $params['sortField'] ?? 'created_at';
        $sortDirection = $params['sortOrder'] ?? 'desc';

        $allowedSortFields = ['ci', 'full_name', 'date_birth', 'sex', 'created_at', 'id'];
        if (!in_array($sortField, $allowedSortFields)) {
            $sortField = 'created_at';
        }

        $query->orderBy($sortField, $sortDirection);

        $perPage = $params['per_page'] ?? 15;
        $perPage = max(1, min(100, $perPage));

        return $query->paginate($perPage);
    }

    public function store($data, $photo)
    {
        $photoPath = null;
        if ($photo) {
            $photoPath = $this->storePhoto($photo, $data['ci'] ?? 'unknown');
        }

        $paySheetData = array_merge($data, [
            'photo' => $photoPath,
        ]);

        $paySheet = PaySheet::create($paySheetData);

        $userID =  Auth::id();


        Activity::create([
            'user_id' => $userID,
            'id_affected' => $paySheet->id,
            'activity' => ActivityEnum::PAYSHEET_CREATED,
        ]);

        $paySheet->load('typePaySheet', 'administrativeLocation');

        Census::create([
            'pay_sheet_id' => $paySheet->id,
            'status' => true,
            'expiration_date' => Carbon::now()->endOfYear()->format('Y-m-d'),
            'user_id' => Auth::id()
        ]);

        return $paySheet;
    }

    public function update($data, $paySheet)
    {

        $paySheet->update($data);

        $userID = Auth::id();

        Activity::create([
            'user_id' => $userID,
            'id_affected' => $paySheet->id,
            'activity' => ActivityEnum::PAYSHEET_UPDATED,
        ]);

        $paySheet->load('typePaySheet', 'administrativeLocation');

        return $paySheet;
    }

    public function updatePhoto($photo, $paySheet)
    {
        $photoPath = $paySheet->photo;

        if ($photo) {
            if ($photoPath) {
                $this->deletePhoto($photoPath);
            }

            $photoPath = $this->storePhoto($photo, $data['ci'] ?? $paySheet->ci);
        }

        $paySheet->update(['photo' => $photoPath]);

        $userID = Auth::id();

        Activity::create([
            'user_id' => $userID,
            'id_affected' => $paySheet->id,
            'activity' => ActivityEnum::PAYSHEET_UPDATED,
        ]);

        return 0;
    }

    public function destroy($paySheet)
    {
        Census::where('pay_sheet_id', $paySheet->id)->delete();
        $paySheet->delete();

        return 0;
    }



    private function storePhoto($photo, string $ci): string
    {
        $extension = $photo->getClientOriginalExtension();
        $fileName = 'photo_' . $ci . '_' . time() . '.' . $extension;

        return $photo->storeAs('photos/pay_sheets', $fileName, 'public');
    }

    private function deletePhoto($photoPath)
    {
        if (Storage::disk('public')->exists($photoPath)) {
            Storage::disk('public')->delete($photoPath);
            return true;
        }
        return false;
    }


    public function storeSheet(Request $request)
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

        $rows = array_slice($data[0], 1);

        $inserted = 0;
        $errors = [];

        foreach ($rows as $index => $row) {
            try {
                if (empty($row[0]) && empty($row[1])) {
                    continue; // Saltar filas vacías
                }

                $cedula = $row[0] ?? '';
                $nombreCompleto = $row[1] ?? '';
                $fechaNacimiento = $row[2] ?? '';
                $sexo = $row[3] ?? '';
                $tipoPersonal = $row[4] ?? '';
                $codigo = $row[5] ?? '';

                if (empty($cedula) || empty($nombreCompleto)) {
                    $errors[] = "Fila " . ($index + 2) . ": Cédula y Nombre son requeridos";
                    continue;
                }

                if (!empty($codigo)) {
                    $typePaySheet = TypePaySheet::firstOrCreate(
                        ['code' => $codigo],
                        ['name' => $tipoPersonal]
                    );
                } else {
                    $typePaySheet = TypePaySheet::firstOrCreate(
                        ['name' => $tipoPersonal]
                    );
                }

                PaySheet::updateOrCreate(
                    [
                        'ci' => $cedula,
                    ],
                    [
                        'full_name' => $nombreCompleto,
                        'date_birth' => $this->formatDate($fechaNacimiento),
                        'sex' => $this->formatSex($sexo),
                        'type_pay_sheet_id' => $typePaySheet->id,
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
        if (empty($date)) {
            return null;
        }

        try {
            if (is_numeric($date)) {
                $unixDate = ($date - 25569) * 86400;
                return date('Y-m-d', $unixDate);
            } else {
                return date('Y-m-d', strtotime($date));
            }
        } catch (\Exception $e) {
            return null;
        }
    }

    private function formatSex($sex)
    {
        $sex = strtoupper(trim($sex));

        if ($sex == 'M' || $sex == 'MASCULINO' || $sex == 'HOMBRE') {
            return 'M';
        } elseif ($sex == 'F' || $sex == 'FEMENINO' || $sex == 'MUJER') {
            return 'F';
        }

        return $sex;
    }
}
