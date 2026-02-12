<?php

namespace App\Models;

use App\Models\AdministrativeLocation;
use App\Models\TypePaySheet;
use Illuminate\Database\Eloquent\Model;

class Census extends Model
{
    protected $fillable = [
        'pay_sheet_id',
        'status',
        'expiration_date',
        'user_id',
        'phone_number',
        'city',
        'state',
        'administrative_location_id',
        'type_pension',
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

    public function paySheet()
    {
        return $this->belongsTo(PaySheet::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function typePaySheet()
    {
        return $this->hasOneThrough(
            TypePaySheet::class,
            PaySheet::class,
        );
    }

    public function administrativeLocation()
    {
        return $this->belongsTo(AdministrativeLocation::class);
    }
}
