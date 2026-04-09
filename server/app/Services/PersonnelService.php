<?php

namespace App\Services;

use App\Models\AuditLog;
use App\Models\Personnel;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;

class PersonnelService
{
    public function get($params = [])
    {
        $query = Personnel::query()->with(['typePersonnel', 'asic', 'dependency']);

        if (!empty($params['search'])) {
            $search = $params['search'];
            $query->where(function ($q) use ($search) {
                $q->where('full_name', 'LIKE', "%{$search}%")
                    ->orWhere('ci', 'LIKE', "%{$search}%");
            });
        }

        $filters = [];
        if (!empty($params['filters'])) {
            $filters = is_string($params['filters']) ? json_decode($params['filters'], true) : $params['filters'];

            if (isset($filters['status'])) {
                $query->where('status', $filters['status']);
            }

            if (isset($filters['type_personnel_id'])) {
                $query->where('type_personnel_id', $filters['type_personnel_id']);
            }

            if (isset($filters['census_status'])) {
                $censusStatus = $filters['census_status'] === 'CENSADO';
                $query->where('census_status', $censusStatus);
            }

            if (isset($filters['full_name'])) {
                $query->where('full_name', 'LIKE', "%{$filters['full_name']}%");
            }

            if (isset($filters['ci'])) {
                $query->where('ci', 'LIKE', "%{$filters['ci']}%");
            }

            if (isset($filters['city'])) {
                $query->where('city', $filters['city']);
            }

            if (isset($filters['sex'])) {
                $query->where('sex', $filters['sex']);
            }

            if (isset($filters['asic_id'])) {
                $query->where('asic_id', $filters['asic_id']);
            }

            if (isset($filters['dependency_id'])) {
                $query->where('dependency_id', $filters['dependency_id']);
            }
        }

        $sortField = $filters['sort_by'] ?? 'created_at';
        $sortDirection = $filters['sort_direction'] ?? 'desc';
        $query->orderBy($sortField, $sortDirection);

        $perPage = $filters['per_page'] ?? 15;
        $perPage = max(1, min(100, $perPage));

        return $query->paginate($perPage);
    }

    public function show(Personnel $personnel)
    {
        $personnel->load(['typePersonnel', 'asic', 'dependency', 'administrativeUnit', 'department', 'service']);

        return $personnel;
    }

    public function store($data, $photo = null)
    {
        $personnel = Personnel::create($data);

        if ($photo) {
            $this->updatePhoto($photo, $personnel);
        }

        AuditLog::create([
            'action' => 'create',
            'auditable_type' => Personnel::class,
            'auditable_id' => $personnel->id,
            'user_id' => Auth::id(),
            'old_values' => null,
            'new_values' => $personnel->toArray(),
        ]);

        return $personnel;
    }

    public function update($data, Personnel $personnel, $photo = null)
    {
        $oldValues = $personnel->toArray();

        $personnel->update($data);

        if ($photo) {
            $this->updatePhoto($photo, $personnel);
        }

        $personnel->refresh();

        AuditLog::create([
            'action' => 'update',
            'auditable_type' => Personnel::class,
            'auditable_id' => $personnel->id,
            'user_id' => Auth::id(),
            'old_values' => $oldValues,
            'new_values' => $personnel->toArray(),
        ]);

        return $personnel;
    }

    public function destroy(Personnel $personnel)
    {
        $oldValues = $personnel->toArray();

        AuditLog::create([
            'action' => 'delete',
            'auditable_type' => Personnel::class,
            'auditable_id' => $personnel->id,
            'user_id' => Auth::id(),
            'old_values' => $oldValues,
            'new_values' => null,
        ]);

        if ($personnel->photo && Storage::disk('public')->exists($personnel->photo)) {
            Storage::disk('public')->delete($personnel->photo);
        }

        $personnel->delete();

        return true;
    }

    public function updatePhoto($photo, Personnel $personnel)
    {
        if ($personnel->photo && Storage::disk('public')->exists($personnel->photo)) {
            Storage::disk('public')->delete($personnel->photo);
        }

        $path = $photo->store('photos', 'public');
        $personnel->update(['photo' => $path]);

        return $personnel;
    }

    public function census(Personnel $personnel)
    {
        $oldValues = $personnel->toArray();

        $personnel->update(['census_status' => true]);

        $personnel->refresh();

        AuditLog::create([
            'action' => 'census',
            'auditable_type' => Personnel::class,
            'auditable_id' => $personnel->id,
            'user_id' => Auth::id(),
            'old_values' => $oldValues,
            'new_values' => $personnel->toArray(),
        ]);

        return $personnel;
    }

    public function uncensus(Personnel $personnel)
    {
        $oldValues = $personnel->toArray();

        $personnel->update(['census_status' => false]);

        $personnel->refresh();

        AuditLog::create([
            'action' => 'uncensus',
            'auditable_type' => Personnel::class,
            'auditable_id' => $personnel->id,
            'user_id' => Auth::id(),
            'old_values' => $oldValues,
            'new_values' => $personnel->toArray(),
        ]);

        return $personnel;
    }
}
