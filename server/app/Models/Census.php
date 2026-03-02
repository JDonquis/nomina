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
        'data',

    ];

    protected $casts = [
        'data' => 'array'
    ];

    public function paySheet()
    {
        return $this->belongsTo(PaySheet::class);
    }


}

