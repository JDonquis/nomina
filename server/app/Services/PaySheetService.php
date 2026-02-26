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
use Intervention\Image\Laravel\Facades\Image;
class PaySheetService
{

    public function get($params = [])
    {
        $query = PaySheet::query()->with('typePaySheet', 'user', 'administrativeLocation');

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

            if (isset($filters['status'])) {
                $filter = $filters['status'];

                if ($filter == 'CENSADO') {
                    $query->where('status', true);
                } else {
                    $query->where('status', false);
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

public function report($year = null)
{
    Carbon::setLocale('es');

    // Usar año actual si no se proporciona
    $year = $year ?? now()->year;

    // Obtener todos los censos válidos del año especificado
    $censuses = Census::with('paySheet.administrativeLocation')
        ->where('status', true)
        ->whereHas('paySheet', function($query) {
            $query->where('status', true);
        })
        ->whereYear('created_at', $year)
        ->get();

    // Si no hay censos en el año, retornar arrays vacíos
    if ($censuses->isEmpty()) {
        return response()->json([
            'asics' => [],
            'days' => []
        ]);
    }

    // Generar array de ASICs con sus censos por día
    $asics = $censuses
        ->groupBy(function($census) {
            return $census->paySheet->administrativeLocation->id ?? 'sin-asic';
        })
        ->map(function($asicCensuses, $asicId) {
            $asic = $asicCensuses->first()->paySheet->administrativeLocation;
            $asicName = $asic->name ?? 'SIN ASIC';

            // Agrupar censos por fecha para este ASIC
            $censadosPorDia = $asicCensuses
                ->groupBy(function($census) {
                    return $census->created_at->format('Y-m-d');
                })
                ->map(function($dayCensuses) {
                    return count($dayCensuses);
                })
                ->toArray();

            return [
                'id' => $asicId,
                'name' => $asicName,
                'censadosPorDia' => $censadosPorDia
            ];
        })
        ->values()
        ->toArray();

    // Obtener la primera y última fecha del año con censos
    $firstDate = $censuses->min('created_at');
    $lastDate = $censuses->max('created_at');

    // Generar array de días desde el primer censo hasta el último censo
    $days = [];
    $start = Carbon::parse($firstDate)->startOfDay();
    $end = Carbon::parse($lastDate)->startOfDay();

    while ($start <= $end) {
        $days[] = [
            'id' => $start->format('Y-m-d'),
            'label' => $start->format('d/m')
        ];
        $start->addDay();
    }

    return response()->json([
        'asics' => $asics,
        'days' => $days
    ]);
}

    public function store($data, $photo)
    {
        $photoPath = null;
        if ($photo) {
            $photoPath = $this->storePhoto($photo, $data['ci'] ?? 'unknown');
        }

        $userID =  Auth::id();
        $data['photo'] = $photoPath;
        $data['user_id'] = $userID;

        $paySheetData = collect($data)->only([
             'nac',
            'ci',
            'email',
            'phone_number',
            'address',
            'municipality',
            'parish',
            'state',
            'city',
            'full_name',
            'date_birth',
            'sex',
            'type_pay_sheet_id',
            'administrative_location_id',
            'photo',
        ])->toArray();

        $paySheet = PaySheet::create($paySheetData);


        if($data['to_census']){

            $pensionData = collect($data)->only([
                // Pension Data
                'type_pension',
                'last_charge',
                'civil_status',
                'minor_child_nro',
                'disabled_child_nro',
                'receive_pension_from_another_organization_status',
                'another_organization_name',
                'has_authorizations',
                // Pension Survivor
                'pension_survivor_status',
                'fullname_causative',
                'age_causative',
                'parent_causative',
                'sex_causative',
                'ci_causative',
                'decease_date',
                'suspend_payment_status',
                'last_payment',
                'user_id'
            ])->toArray();

            $pensionData['status'] = true;

            $paySheet->update($pensionData);

            Census::create([
                'pay_sheet_id' => $paySheet->id,
                'status' => true,
                'expiration_date' => Carbon::now()->endOfYear()->format('Y-m-d'),
                'user_id' => $userID,
                'data' => $paySheet->load('typePaySheet','user','administrativeLocation')
            ]);

        }


        $paySheet->load('typePaySheet', 'user', 'administrativeLocation');

        Activity::create([
            'user_id' => $userID,
            'id_affected' => $paySheet->id,
            'activity' => ActivityEnum::PAYSHEET_CREATED,
            'pay_sheet' => $paySheet

        ]);

        return $paySheet;
    }

    public function update($data, $paySheet)
    {
        $userID = Auth::id();

        $data['user_id'] = $userID;

        $paySheetData = collect($data)->only([
             'nac',
            'ci',
            'email',
            'phone_number',
            'address',
            'municipality',
            'parish',
            'state',
            'city',
            'full_name',
            'date_birth',
            'sex',
            'type_pay_sheet_id',
            'administrative_location_id',
            'photo',
        ])->toArray();

        $paySheet->update($paySheetData);



        if($data['to_census']){

            $pensionData = collect($data)->only([
                // Pension Data
                'type_pension',
                'last_charge',
                'civil_status',
                'minor_child_nro',
                'disabled_child_nro',
                'receive_pension_from_another_organization_status',
                'another_organization_name',
                'has_authorizations',
                // Pension Survivor
                'pension_survivor_status',
                'fullname_causative',
                'age_causative',
                'parent_causative',
                'sex_causative',
                'ci_causative',
                'decease_date',
                'suspend_payment_status',
                'last_payment',
                'user_id'
            ])->toArray();

            $pensionData['status'] = true;

            $paySheet->update($pensionData);


            // Actualizamos el status de los demas censos
            Census::where('pay_sheet_id', $paySheet->id)->update(['status' => false]);

            Census::create([
                'pay_sheet_id' => $paySheet->id,
                'status' => true,
                'expiration_date' => Carbon::now()->endOfYear()->format('Y-m-d'),
                'user_id' => $userID,
                'data' => $paySheet->load('typePaySheet','user','administrativeLocation')
            ]);


        }



        $paySheet->load('typePaySheet', 'user', 'administrativeLocation');


        Activity::create([
            'user_id' => $userID,
            'id_affected' => $paySheet->id,
            'activity' => ActivityEnum::PAYSHEET_UPDATED,
            'pay_sheet' => $paySheet

        ]);

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

        $paySheet->load('typePaySheet', 'user', 'administrativeLocation');


        Activity::create([
            'user_id' => $userID,
            'id_affected' => $paySheet->id,
            'activity' => ActivityEnum::PAYSHEET_UPDATED,
            'pay_sheet' => $paySheet

        ]);

        return 0;
    }

    public function destroy($paySheet)
    {
        Census::where('pay_sheet_id', $paySheet->id)->delete();

        $userID = Auth::id();

        $paySheet->load('typePaySheet', 'user', 'administrativeLocation');


        Activity::create([
            'user_id' => $userID,
            'id_affected' => $paySheet->id,
            'activity' => ActivityEnum::PAYSHEET_DELETED,
            'pay_sheet' => $paySheet
        ]);

        $paySheet->delete();

        return 0;
    }



    private function storePhoto($photo, string $ci): string
{
    $fileName = 'photo_' . $ci . '_' . time() . '.webp';
    $path = 'photos/pay_sheets/' . $fileName;

    $encoded = Image::read($photo)
        ->toWebp(quality: 80);

    Storage::disk('public')->put($path, $encoded);

    return $path;
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
