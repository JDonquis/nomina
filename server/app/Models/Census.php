<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Census extends Model
{
    protected $fillable = [
        'pay_sheet_id',
        'status',
        'expiration_date',
        'user_id',
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
            'id', // Foreign key on PaySheet table
            'id', // Foreign key on TypePaySheet table
            'pay_sheets_id', // Local key on Census table
            'type_pay_sheet_id' // Local key on PaySheet table
        );
    }
}
