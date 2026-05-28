<?php

namespace App\Services;

use App\Models\AuditLog;

class AuditLogService
{
    public function get($filters = [])
    {
        $query = AuditLog::query();

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

        return $query->with('user', 'auditable')->orderBy('created_at', 'desc')->paginate();
    }
}
