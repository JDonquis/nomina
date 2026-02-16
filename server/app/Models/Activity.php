<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Activity extends Model
{
    protected $fillable = [
        'user_id',
        'id_affected',
        'activity',
        'pay_sheet'
    ];

    protected $casts = [
        'pay_sheet' => 'array',
    ];

    public function user(){
        return $this->belongsTo(User::class);
    }
}
