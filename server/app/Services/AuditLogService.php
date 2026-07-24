<?php

namespace App\Services;

use App\Models\AuditLog;
use Illuminate\Support\Facades\Log;
use App\Models\Personnel;
use Illuminate\Database\Eloquent\Relations\MorphTo;
class AuditLogService
{
    public function get($generalFilters = [])
    {
        $filters = json_decode($generalFilters['filters'], true);
        $query = AuditLog::query();

        $search = $generalFilters['search'] ?? null;

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->whereHasMorph(
                    'auditable',
                    '*',
                    function ($subQuery) use ($search) {
                        $subQuery->where('ci', 'like', "%{$search}%");
                    }
                );
            });
        }

        // if (isset($filters['action'])) {
        //     $query->where('action', $filters['action']);
        // }

        // if (isset($filters['user_id'])) {
        //     $query->where('user_id', $filters['user_id']);
        // }

        // if (isset($filters['date_from'])) {
        //     $query->whereDate('created_at', '>=', $filters['date_from']);
        // }

        // if (isset($filters['date_to'])) {
        //     $query->whereDate('created_at', '<=', $filters['date_to']);
        // }

         if (isset($filters['auditable.status'])) {
            $query->whereHas('auditable', function ($q) use ($filters) {
                $translate = ['activo'=> 'active', 'inactivo'=> 'inactive'];
                $q->where('status', $translate[$filters['auditable.status']]);
            });
        }

        $actionLabels = [
            'update_and_census' => 'Actualizacion y censo',
            'census'            => 'Censo',
            'update'            => 'Actualizacion',
            'create_and_census' => 'Creacion y censo',
            'delete'            => 'Eliminacion',
        ];

        return $query->with(['user', 'auditable' => function (MorphTo $morphTo) {
            $morphTo->morphWith([
                Personnel::class => ['typePersonnel', 'asic', 'service', 'dependency', 'administrativeUnit', 'department'],
            ]);}])
            ->orderBy('created_at', 'desc')
            ->paginate()
            ->through(function ($log) use ($actionLabels) {
                $log->action = $actionLabels[$log->action] ?? $log->action;
                return $log;
            });

    }
}
