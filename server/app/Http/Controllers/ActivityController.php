<?php

namespace App\Http\Controllers;

use App\Models\Activity;
use Illuminate\Http\Request;

class ActivityController extends Controller
{
    /**
     * Handle the incoming request.
     */
    public function __invoke(Request $request)
    {
        $query =  Activity::query()->with('user');

        $sortField = $params['sortField'] ?? 'created_at';
        $sortDirection = $params['sortOrder'] ?? 'desc';

        $allowedSortFields = ['id','created_at'];
        if (!in_array($sortField, $allowedSortFields)) {
            $sortField = 'created_at';
        }

        $query->orderBy($sortField, $sortDirection);

        $perPage = $params['per_page'] ?? 15;
        $perPage = max(1, min(100, $perPage));

        return $query->paginate($perPage);

    }
}
