<?php

namespace App\Models;

use App\Models\AdministrativeLocation;
use App\Models\Census;
use App\Models\TypePaySheet;
use Illuminate\Database\Eloquent\Model;

class PaySheet extends Model
{
    protected $fillable = [
        // Personal Data
        'nac',
        'ci',
        'email',
        'phone_number',
        'address',
        'municipality',
        'parish',
        'state',
        'city',
        'full_name',
        'date_birth',
        'sex',
        'type_pay_sheet_id',
        'administrative_location_id',
        'photo',
        //Pension Data,
        'type_pension',
        'last_charge',
        'civil_status',
        'minor_child_nro',
        'disabled_child_nro',
        'receive_pension_from_another_organization_status',
        'another_organization_name',
        'has_authorizations',
        // Pension Survivor
        'pension_survivor_status',
        'fullname_causative',
        'age_causative',
        'parent_causative',
        'sex_causative',
        'ci_causative',
        'decease_date',
        'suspend_payment_status',
        'last_payment',

        'user_id'

    ];


    public function typePaySheet()
    {
        return $this->belongsTo(TypePaySheet::class);
    }

    public function censuses()
    {
        return $this->hasMany(Census::class, 'pay_sheet_id')->orderBy('id','desc');
    }

    public function administrativeLocation()
    {
        return $this->belongsTo(AdministrativeLocation::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
