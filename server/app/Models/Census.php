<?php

namespace App\Models;

use App\Models\AdministrativeLocation;
use App\Models\TypePaySheet;
use Illuminate\Database\Eloquent\Model;

class Census extends Model
{
    protected $fillable = [
        'pay_sheet_id',
        'active_personnel_id',
        'user_id',
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

    public function activePersonnel()
    {
        return $this->belongsTo(ActivePersonnel::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }


}

