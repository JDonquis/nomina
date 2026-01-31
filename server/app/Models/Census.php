<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Census extends Model
{
    protected $fillable = [
        'pay_sheets_id',
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
}
