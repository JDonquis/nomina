<?php

namespace App\Services;

use Carbon\Carbon;
use App\Models\Census;
use App\Models\PaySheet;
use App\Models\User;
use App\Models\ActivePersonnel;
use Illuminate\Support\Facades\Auth;

class CensusService
{
    public function get($params = [])
    {

        $query = Census::query()->with(['paySheet.typePaySheet', 'activePersonnel']);

        if (!empty($params['search'])) {
            $search = $params['search'];
            $query->where(function ($q) use ($search) {
                $q->whereHas('paySheet', function ($paySheetQuery) use ($search) {
                    $paySheetQuery->where('ci', 'LIKE', "%{$search}%")
                        ->orWhere('full_name', 'LIKE', "%{$search}%");
                })->orWhereHas('activePersonnel', function ($activeQuery) use ($search) {
                    $activeQuery->where('ci', 'LIKE', "%{$search}%")
                        ->orWhere('full_name', 'LIKE', "%{$search}%");
                });
            });
        }

        $filters = [];
        if (!empty($params['filters'])) {
            $filters = is_string($params['filters']) ? json_decode($params['filters'], true) : $params['filters'];

            // Filtro por tipo de personal (Activo o Jubilado)
            if (isset($filters['personnel_type_filter'])) {
                if ($filters['personnel_type_filter'] === 'active') {
                    $query->whereNotNull('active_personnel_id');
                } elseif ($filters['personnel_type_filter'] === 'inactive') {
                    $query->whereNotNull('pay_sheet_id');
                }
            }

            if (isset($filters['pay_sheet.ci'])) {
                $filter = $filters['pay_sheet.ci'];
                $query->whereHas('paySheet', function ($subQuery) use ($filter) {
                    $subQuery->where('ci', 'LIKE', "%{$filter}%");
                });
            }

            if (isset($filters['active_personnel.ci'])) {
                $filter = $filters['active_personnel.ci'];
                $query->whereHas('activePersonnel', function ($subQuery) use ($filter) {
                    $subQuery->where('ci', 'LIKE', "%{$filter}%");
                });
            }

            if (isset($filters['pay_sheet.full_name'])) {
                $filter = $filters['pay_sheet.full_name'];
                $query->whereHas('paySheet', function ($subQuery) use ($filter) {
                    $subQuery->where('full_name', 'LIKE', "%{$filter}%");
                });
            }

            if (isset($filters['active_personnel.full_name'])) {
                $filter = $filters['active_personnel.full_name'];
                $query->whereHas('activePersonnel', function ($subQuery) use ($filter) {
                    $subQuery->where('full_name', 'LIKE', "%{$filter}%");
                });
            }

            if (isset($filters['id'])) {
                $filter = $filters['id'];
                $query->where('id', 'LIKE', "%{$filter}%");
            }


            if (isset($filters['pay_sheet.city'])) {
                $filter = $filters['pay_sheet.city'];
                $query->whereHas('paySheet', function ($subQuery) use ($filter) {
                    $subQuery->where('city', $filter);
                });
            }


            if (isset($filters['pay_sheet.type_pension'])) {
                $filter = $filters['pay_sheet.type_pension'];
                $query->whereHas('typePaySheet', function ($subQuery) use ($filter) {
                    $subQuery->where('id', $filter);
                });
            }

            if (isset($filters['administrative_location.id'])) {
                $filter = $filters['administrative_location.id'];
                $query->where('administrative_location_id', $filter);
            }

            if (isset($filters['user_id'])) {
                $query->where('user_id', $filters['user_id']);
            }

            if (isset($filters['type_pay_sheet_id'])) {
                $query->whereHas('paySheet', function ($q) use ($filters) {
                    $q->where('type_pay_sheet_id', $filters['type_pay_sheet_id']);
                });
            }

            if (isset($filters['sex'])) {
                $query->whereHas('paySheet', function ($q) use ($filters) {
                    $q->where('sex', $filters['sex']);
                });
            }

            if (isset($filters['status'])) {
                $query->where('status', $filters['status']);
            }

            if (isset($filters['expiration_date_from'])) {
                $query->where('expiration_date', '>=', $filters['expiration_date_from']);
            }

            if (isset($filters['expiration_date_to'])) {
                $query->where('expiration_date', '<=', $filters['expiration_date_to']);
            }
        }

        // Ordenamiento
        $sortField = $filters['sort_by'] ?? 'created_at';
        $sortDirection = $filters['sort_direction'] ?? 'desc';

        $query->orderBy($sortField, $sortDirection);

        // Paginación
        $perPage = $filters['per_page'] ?? 15;
        $perPage = max(1, min(100, $perPage));

        return $query->paginate($perPage);
    }

    public function store($data)
    {

        $data['status'] = true;
        $data['expiration_date'] = Carbon::now()->endOfYear()->format('Y-m-d');
        $data['user_id'] = Auth::id();

        if (empty($data['data'])) {
            if (!empty($data['pay_sheet_id'])) {
                $paySheet = PaySheet::find($data['pay_sheet_id']);
                $data['data'] = $paySheet->load('typePaySheet', 'user', 'administrativeLocation');
            } elseif (!empty($data['active_personnel_id'])) {
                $active = ActivePersonnel::find($data['active_personnel_id']);
                $data['data'] = $active->load('asic', 'dependency', 'administrativeUnit', 'department', 'service', 'familyMembers');
            }
        }

        $census = Census::create($data);

        if (!empty($census->pay_sheet_id)) {
            // Check if latest_census_id column exists in pay_sheets to avoid errors
            try {
                PaySheet::where('id', $census->pay_sheet_id)->update(['latest_census_id' => $census->id]);
            } catch (\Exception $e) {
                // Column might not exist
            }
            Census::where('pay_sheet_id', $census->pay_sheet_id)->whereNot('id', $census->id)->update(['status' => false]);
        } elseif (!empty($census->active_personnel_id)) {
            ActivePersonnel::where('id', $census->active_personnel_id)->update(['latest_census_id' => $census->id]);
            Census::where('active_personnel_id', $census->active_personnel_id)->whereNot('id', $census->id)->update(['status' => false]);
        }


        return $census;
    }


    public function destroy(Census $census)
    {
        $census->delete();



        return 0;
    }

    public function exportJson()
    {
        // Get all censuses with their associated user (auditor)
        $censuses = Census::with('user')->get();

        // Get all unique users who performed censuses
        $userIds = $censuses->pluck('user_id')->unique()->filter();
        $users = User::whereIn('id', $userIds)->get()->makeVisible('password');

        // Get all PaySheets (Jubilados/Pensionados)
        $paySheets = PaySheet::all();

        // Get all ActivePersonnel
        $activePersonnel = ActivePersonnel::all();

        return [
            'version' => '1.1',
            'exported_at' => Carbon::now()->toDateTimeString(),
            'users' => $users,
            'pay_sheets' => $paySheets,
            'active_personnel' => $activePersonnel,
            'censuses' => $censuses
        ];
    }

    public function importJson($data)
    {
        $importedUsersCount = 0;
        $importedPaySheetsCount = 0;
        $importedActivePersonnelCount = 0;
        $importedCensusesCount = 0;
        $logs = [];

        // 1. Import Users (Auditores)
        $userMap = []; // old_id => new_id
        if (isset($data['users'])) {
            foreach ($data['users'] as $userData) {
                $user = User::updateOrCreate(
                    ['email' => $userData['email']],
                    [
                        'full_name' => $userData['full_name'],
                        'charge' => $userData['charge'] ?? null,
                        'is_admin' => $userData['is_admin'] ?? false,
                        'password' => $userData['password'] ?? bcrypt('secret'),
                        'status' => $userData['status'] ?? true,
                    ]
                );
                $userMap[$userData['id']] = $user->id;
                $importedUsersCount++;
            }
        }

        // 2. Import PaySheets (Jubilados/Pensionados)
        $paySheetMap = []; // old_id => new_id
        if (isset($data['pay_sheets'])) {
            foreach ($data['pay_sheets'] as $psData) {
                $ps = PaySheet::updateOrCreate(
                    ['ci' => $psData['ci']],
                    collect($psData)->except(['id', 'created_at', 'updated_at', 'latest_census_id'])->toArray()
                );
                $paySheetMap[$psData['id']] = $ps->id;
                $importedPaySheetsCount++;
            }
        }

        // 3. Import ActivePersonnel
        $activeMap = []; // old_id => new_id
        if (isset($data['active_personnel'])) {
            foreach ($data['active_personnel'] as $apData) {
                $ap = ActivePersonnel::updateOrCreate(
                    ['ci' => $apData['ci']],
                    collect($apData)->except(['id', 'created_at', 'updated_at', 'latest_census_id'])->toArray()
                );
                $activeMap[$apData['id']] = $ap->id;
                $importedActivePersonnelCount++;
            }
        }

        // 4. Import Censuses
        if (isset($data['censuses'])) {
            foreach ($data['censuses'] as $censusData) {
                $censusContent = is_string($censusData['data']) ? json_decode($censusData['data'], true) : $censusData['data'];
                
                $paySheetId = null;
                $activePersonnelId = null;

                // Intentar mapear por ID original si existe en nuestro mapa actual
                if (isset($censusData['pay_sheet_id']) && isset($paySheetMap[$censusData['pay_sheet_id']])) {
                    $paySheetId = $paySheetMap[$censusData['pay_sheet_id']];
                } elseif (isset($censusData['active_personnel_id']) && isset($activeMap[$censusData['active_personnel_id']])) {
                    $activePersonnelId = $activeMap[$censusData['active_personnel_id']];
                } else {
                    // Si no hay mapeo por ID, buscar por CI en los datos del censo
                    $ci = $censusContent['ci'] ?? null;
                    if ($ci) {
                        $ps = PaySheet::where('ci', $ci)->first();
                        if ($ps) {
                            $paySheetId = $ps->id;
                        } else {
                            $ap = ActivePersonnel::where('ci', $ci)->first();
                            if ($ap) {
                                $activePersonnelId = $ap->id;
                            }
                        }
                    }
                }

                if (!$paySheetId && !$activePersonnelId) {
                    $logs[] = "No se encontró personal vinculado para el censo de fecha " . $censusData['created_at'];
                    continue;
                }

                $census = Census::updateOrCreate(
                    [
                        'pay_sheet_id' => $paySheetId,
                        'active_personnel_id' => $activePersonnelId,
                        'created_at' => $censusData['created_at']
                    ],
                    [
                        'user_id' => $userMap[$censusData['user_id']] ?? Auth::id(),
                        'status' => $censusData['status'],
                        'expiration_date' => $censusData['expiration_date'],
                        'data' => $censusContent,
                        'updated_at' => $censusData['updated_at'] ?? Carbon::now(),
                    ]
                );

                // Actualizar puntero al último censo
                if ($census->status) {
                    if ($paySheetId) {
                        try { PaySheet::where('id', $paySheetId)->update(['latest_census_id' => $census->id]); } catch (\Exception $e) {}
                    } elseif ($activePersonnelId) {
                        ActivePersonnel::where('id', $activePersonnelId)->update(['latest_census_id' => $census->id]);
                    }
                }

                $importedCensusesCount++;
            }
        }

        return [
            'users_imported' => $importedUsersCount,
            'pay_sheets_imported' => $importedPaySheetsCount,
            'active_personnel_imported' => $importedActivePersonnelCount,
            'censuses_imported' => $importedCensusesCount,
            'logs' => $logs
        ];
    }
}
