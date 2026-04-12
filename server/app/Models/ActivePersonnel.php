<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class ActivePersonnel extends Model
{
    protected $table = 'active_personnels';

    protected $fillable = [
        'sync_id',
        'nac',
        'ci',
        'full_name',
        'date_birth',
        'sex',
        'civil_status',
        'degree_obtained',
        'postgraduate_degree',
        'home_address',
        'email',
        'mobile_phone',
        'fixed_phone',
        'shirt_size',
        'pant_size',
        'shoe_size',
        'photo',
        'id_card_photo',
        'payroll_dependency',
        'asic_id',
        'dependency_id',
        'administrative_unit_id',
        'department_id',
        'service_id',
        'payroll_code',
        'payroll_name',
        'entry_date',
        'job_title',
        'is_resident',
        'residency_type',
        'level',
        'university',
        'position_code',
        'shift',
        'bank_account_number',
        'job_code',
        'observation',
        'personnel_type',
        'budget',
        'labor_relationship',
        'grade',
        'user_id',
        'latest_census_id',
        'status'
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

    public function asic()
    {
        return $this->belongsTo(ASIC::class);
    }

    public function dependency()
    {
        return $this->belongsTo(Dependency::class);
    }

    public function administrativeUnit()
    {
        return $this->belongsTo(AdministrativeUnit::class);
    }

    public function department()
    {
        return $this->belongsTo(Department::class);
    }

    public function service()
    {
        return $this->belongsTo(Service::class);
    }

    public function familyMembers()
    {
        return $this->hasMany(FamilyMember::class);
    }

    public function censuses()
    {
        return $this->hasMany(Census::class, 'active_personnel_id')->orderBy('id', 'desc');
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
