<?php

namespace App\Services;

use App\Models\JobPosition;

class JobPositionService
{
    public function getJobPositions($search = null)
    {
        $query = JobPosition::select('id', 'name');

        if ($search) {
            $query->where('name', 'like', "%{$search}%");
        }

        return $query->get();
    }
}
