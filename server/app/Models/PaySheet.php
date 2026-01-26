<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PaySheet extends Model
{
    protected $fillable = [
        'ci',
        'full_name',
        'date_birth',
        'sex',
        'type_pay_sheet_id',
    ];


    public function typePaySheet()
    {
        return $this->belongsTo(TypePaySheet::class);
    }
}
