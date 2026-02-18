<?php

namespace App\Services;

use Carbon\Carbon;
use App\Models\Census;
use App\Models\PaySheet;
use Illuminate\Support\Facades\Auth;

class CensusService
{
    public function get($params = [])
    {

        $query = Census::query()->with(['paySheet.typePaySheet']);

        if (!empty($params['search'])) {
            $search = $params['search'];
            $query->where(function ($q) use ($search) {
                $q->whereHas('paySheet', function ($paySheetQuery) use ($search) {
                    $paySheetQuery->where('ci', 'LIKE', "%{$search}%")
                        ->orWhere('full_name', 'LIKE', "%{$search}%")
                        ->orWhereHas('typePaySheet', function ($typeQuery) use ($search) {
                            $typeQuery->where('name', 'LIKE', "%{$search}%")
                                ->orWhere('code', 'LIKE', "%{$search}%");
                        });
                });
            });
        }

        if (!empty($params['filters'])) {
            $filters = json_decode($params['filters'], true);


            if (isset($filters['pay_sheet.ci'])) {
                $filter = $filters['pay_sheet.ci'];
                $query->whereHas('paySheet', function ($subQuery) use ($filter) {
                    $subQuery->where('ci', 'LIKE', "%{$filter}%");
                });
            }

            if (isset($filters['pay_sheet.full_name'])) {
                $filter = $filters['pay_sheet.full_name'];
                $query->whereHas('paySheet', function ($subQuery) use ($filter) {
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

            if (isset($filters['user.id'])) {
                $filter = $filters['user.id'];
                $query->whereHas('user', function ($subQuery) use ($filter) {
                    $subQuery->where('id', $filter);
                });
            }
        }

        // Filtro por tipo de pay_sheet
        if (!empty($filters['type_pay_sheet_id'])) {
            $query->whereHas('paySheet', function ($q) use ($filters) {
                $q->where('type_pay_sheet_id', $filters['type_pay_sheet_id']);
            });
        }

        // Filtro por user
        if (!empty($filters['user_id'])) {
            $query->where('user_id', $filters['user_id']);
        }

        // Filtro por sexo
        if (!empty($filters['sex'])) {
            $query->whereHas('paySheet', function ($q) use ($filters) {
                $q->where('sex', $filters['sex']);
            });
        }

        // Filtro por estado del census (si aplica)
        if (!empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        // Filtro por fecha de expiración
        if (!empty($filters['expiration_date_from'])) {
            $query->where('expiration_date', '>=', $filters['expiration_date_from']);
        }

        if (!empty($filters['expiration_date_to'])) {
            $query->where('expiration_date', '<=', $filters['expiration_date_to']);
        }

        // Ordenamiento - ahora por fecha de creación del CENSUS
        $sortField = $filters['sort_by'] ?? 'censuses.created_at'; // Cambiado para ser explícito
        $sortDirection = $filters['sort_direction'] ?? 'desc';

        // Mapear campos de PaySheet si se usan para ordenar
        $paySheetFields = ['ci', 'full_name', 'date_birth', 'sex'];
        $censusFields = ['created_at', 'expiration_date', 'status'];

        if (in_array($sortField, $paySheetFields)) {
            // Si el campo es de PaySheet, ordenar a través de la relación
            $query->join('pay_sheets', 'censuses.pay_sheets_id', '=', 'pay_sheets.id')
                ->orderBy("pay_sheets.{$sortField}", $sortDirection)
                ->select('censuses.*');
        } elseif (in_array($sortField, $censusFields)) {
            // Si el campo es de Census, ordenar directamente
            $query->orderBy("censuses.{$sortField}", $sortDirection);
        } else {
            // Por defecto, ordenar por fecha de creación del Census
            $query->orderBy('censuses.created_at', 'desc');
        }

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
        $census = Census::create($data);

        PaySheet::where('id', $census->pay_sheet_id)->update(['latest_census_id' => $census->id]);
        Census::where('pay_sheet_id', $census->pay_sheet_id)->whereNot('id', $census->id)->update(['status' => false]);


        return $census;
    }

    public function destroy(Census $census)
    {
        $census->delete();

        return 0;
    }
}
