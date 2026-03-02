<?php

namespace App\Http\Controllers;

use App\Models\Activity;
use Carbon\Carbon;
use Illuminate\Http\Request;

class ActivityController extends Controller
{
    /**
     * Handle the incoming request.
     */
    public function __invoke(Request $request)
    {
        $query =  Activity::query()->with('user');

        $params = $request->all();

        if (!empty($params['search'])) {
            $search = $params['search'];
            $query->where(function ($q) use ($search) {
                $q->where('activity', 'LIKE', "%{$search}%")
                ->orWhere('pay_sheet->full_name','LIKE',"%{$search}%")
                ->orWhere('pay_sheet->ci','LIKE',"%{$search}%")
                    ->orWhereHas('user', function ($subQuery) use ($search) {
                        $subQuery->where('full_name', 'LIKE', "%{$search}%");
                    });
            });
        }

        if (!empty($params['filters'])) {
            $filters = json_decode($params['filters'], true);

            if (isset($filters['activity'])) {
                $filter = $filters['activity'];

                $query->where('activity', $filter);
            }

            if (isset($filters['user.full_name'])) {
                $filter = $filters['user.full_name'];
                $query->whereHas('user',function($q) use($filter) {
                    $q->where('full_name',$filter);
                });
            }

           if (isset($filters['created_at'])) {
            $filter = $filters['created_at'];

            try {
                // Parsear cualquier formato de fecha válido
                $date = Carbon::parse($filter)->format('Y-m-d');
                $query->whereDate('created_at', $date);
            } catch (\Exception $e) {
                // Si no se puede parsear, intentar con el valor original
                $query->whereDate('created_at', $filter);
            }
        }

            if (isset($filters['pay_sheet.id'])) {
                $filter = $filters['pay_sheet.id'];
                $query->where('pay_sheet->id', $filter);
            }
        }

        $sortField = $params['sortField'] ?? 'created_at';
        $sortDirection = $params['sortOrder'] ?? 'desc';

        $allowedSortFields = ['id','created_at', 'activity'];
        if (!in_array($sortField, $allowedSortFields)) {
            $sortField = 'created_at';
        }

        $query->orderBy($sortField, $sortDirection);

        $perPage = $params['per_page'] ?? 15;
        $perPage = max(1, min(100, $perPage));

        return $query->paginate($perPage);

    }
}
