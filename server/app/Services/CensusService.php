<?php

namespace App\Services;

use Carbon\Carbon;
use App\Models\Census;
use App\Models\PaySheet;
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
            PaySheet::where('id', $census->pay_sheet_id)->update(['latest_census_id' => $census->id]);
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
}
