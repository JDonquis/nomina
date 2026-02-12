<?php

namespace App\Models;

use App\Models\AdministrativeLocation;
use App\Models\Census;
use App\Models\TypePaySheet;
use Illuminate\Database\Eloquent\Model;

class PaySheet extends Model
{
    protected $fillable = [
        'nac',
        'ci',
        'full_name',
        'date_birth',
        'sex',
        'type_pay_sheet_id',
        'latest_census_id',
        'photo',
    ];


    public function typePaySheet()
    {
        return $this->belongsTo(TypePaySheet::class);
    }

    public function censuses()
    {
        return $this->hasMany(Census::class, 'pay_sheet_id');
    }

    public function latestCensus()
    {
        return $this->belongsTo(Census::class, 'latest_census_id');
    }
}
