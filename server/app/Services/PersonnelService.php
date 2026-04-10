<?php

namespace App\Services;

use App\Models\AuditLog;
use App\Models\Personnel;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class PersonnelService
{
    private $fieldsWithoutCensus = [
        'photo',
        'nac',
        'ci',
        'full_name',
        'date_birth',
        'sex',
        'asic_id',
        'city',
        'state',
        'phone_number',
        'email',
        'municipality',
        'parish',
        'address',
        'civil_status',
        'receive_pension_from_another_organization_status',
        'has_authorizations',
        'pension_survivor_status',
        'suspend_payment_status',
        'type_personnel_id',
        'status',
        'additional_data' => [
            'type_pension',
            'type_pay_sheet',
            'last_charge',
            'minor_child_nro',
            'disabled_child_nro',
            'another_organization_name',
            'fullname_causative',
            'age_causative',
            'parent_causative',
            'sex_causative',
            'ci_causative',
            'decease_date',
            'last_payment',
            'degree_obtained',
            'postgraduate_degree',
            'mobile_phone',
            'fixed_phone',
            'shirt_size',
            'pant_size',
            'shoe_size',
        ],
    ];

    public function get($params = [], $type = 'inactive')
    {
        $query = Personnel::query()->with(['typePersonnel', 'asic', 'dependency']);

        $query->where('status', $type === 'active' ? 'active' : 'inactive');

        if (isset($params['census_status'])) {
            $censusStatus = $params['census_status'] === 'CENSADO' || $params['census_status'] === true;
            $query->where('census_status', $censusStatus);
        }

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
        $personnel->load(['typePersonnel', 'asic', 'dependency', 'administrativeUnit', 'department', 'service', 'auditLogs']);

        return $personnel;
    }

    private function getAllowedFields($toCensus)
    {
        $allowedFields = [];

        foreach ($this->fieldsWithoutCensus as $key => $value) {
            if (is_array($value)) {
                $allowedFields['additional_data'] = array_keys($value);
            } else {
                $allowedFields[] = $value;
            }
        }

        return $toCensus ? null : $allowedFields;
    }

    private function filterData($data, $allowedFields)
    {
        if ($allowedFields === null) {
            return $data;
        }

        $filtered = [];

        foreach ($data as $key => $value) {
            if (in_array($key, $allowedFields)) {
                $filtered[$key] = $value;
            }
        }

        if (isset($data['additional_data']) && isset($allowedFields['additional_data'])) {
            $filtered['additional_data'] = [];
            foreach ($data['additional_data'] as $key => $value) {
                if (in_array($key, $allowedFields['additional_data'])) {
                    $filtered['additional_data'][$key] = $value;
                }
            }
            if (empty($filtered['additional_data'])) {
                unset($filtered['additional_data']);
            }
        }

        return $filtered;
    }

    public function store($data, $photo = null)
    {
        $action = 'create';

        Log::info('Datos recibidos para crear personal', ['data' => $data]);

        $censusStatus = $data['to_census'] ?? false;
        unset($data['to_census']);

        $allowedFields = $this->getAllowedFields($censusStatus);
        $data = $this->filterData($data, $allowedFields);

        $personnel = Personnel::create($data);

        if ($photo) {
            $this->updatePhoto($photo, $personnel);
        }

        if ($censusStatus) {
            $action = 'create_and_census';
            $personnel->update(['census_status' => true]);
        }

        AuditLog::create([
            'action' => $action,
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

        $action = 'update';
        $censusStatus = $data['to_census'] ?? false;


        $oldValues = $personnel->toArray();

        $allowedFields = $this->getAllowedFields($censusStatus);
        $data = $this->filterData($data, $allowedFields);

        if (!empty($data)) {
            $personnel->update($data);
        }

        if ($photo) {
            $this->updatePhoto($photo, $personnel);
        }

        if ($censusStatus) {
            $action = 'update_and_census';
            $personnel->update(['census_status' => true]);
        }

        $personnel->refresh();

        AuditLog::create([
            'action' => $action,
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
}
