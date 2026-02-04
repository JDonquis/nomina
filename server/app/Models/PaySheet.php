<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PaySheet extends Model
{
    protected $fillable = [
        'nac',
        'ci',
        'full_name',
        'date_birth',
        'sex',
        'city',
        'state',
        'administrative_location_id',
        'phone_number',
        'photo',
        'type_pension',
        'type_pay_sheet_id',
        'last_charge',
        'civil_status',
        'minor_child_nro',
        'disabled_child_nro',
        'receive_pension_from_another_organization_status',
        'another_organization_name',
        'has_authorizations',
        'pension_survivor_status',
        'fullname_causative',
        'age_causative',
        'parent_causative',
        'sex_causative',
        'ci_causative',
        'decease_date',
        'suspend_payment_status',
        'last_payment',
    ];


    public function typePaySheet()
    {
        return $this->belongsTo(TypePaySheet::class);
    }

    public function administrativeLocation()
    {
        return $this->belongsTo(AdministrativeLocation::class);
    }

    public function censuses()
    {
        return $this->hasMany(Census::class, 'pay_sheets_id');
    }

    public function latestCensus()
    {
        return $this->hasOne(Census::class, 'pay_sheets_id')
            ->latestOfMany();
    }
}
