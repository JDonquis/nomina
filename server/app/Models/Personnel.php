<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

class Personnel extends Model
{
    protected $fillable = [
        'sync_id',
        'status',
        'census_status',
        'type_personnel_id',
        'nac',
        'ci',
        'full_name',
        'date_birth',
        'sex',
        'civil_status',
        'phone_number',
        'email',
        'address',
        'municipality',
        'parish',
        'state',
        'city',
        'photo',
        'asic_id',
        'dependency_id',
        'administrative_unit_id',
        'department_id',
        'service_id',
        'receive_pension_from_another_organization_status',
        'has_authorizations',
        'pension_survivor_status',
        'suspend_payment_status',
        'is_resident',
        'additional_data',
    ];

    protected $casts = [
        'census_status' => 'boolean',
        'receive_pension_from_another_organization_status' => 'boolean',
        'has_authorizations' => 'boolean',
        'pension_survivor_status' => 'boolean',
        'suspend_payment_status' => 'boolean',
        'is_resident' => 'boolean',
        'additional_data' => 'array',
    ];

    protected static function boot()
    {
        parent::boot();
        static::creating(function ($model) {
            if (empty($model->sync_id)) {
                $model->sync_id = (string) Str::uuid();
            }
        });
    }

    public function typePersonnel(): BelongsTo
    {
        return $this->belongsTo(TypePersonnel::class);
    }

    public function asic(): BelongsTo
    {
        return $this->belongsTo(ASIC::class);
    }

    public function dependency(): BelongsTo
    {
        return $this->belongsTo(Dependency::class);
    }

    public function administrativeUnit(): BelongsTo
    {
        return $this->belongsTo(AdministrativeUnit::class);
    }

    public function department(): BelongsTo
    {
        return $this->belongsTo(Department::class);
    }

    public function service(): BelongsTo
    {
        return $this->belongsTo(Service::class);
    }

    public function auditLogs()
    {
        return $this->morphMany(AuditLog::class, 'auditable');
    }
}
