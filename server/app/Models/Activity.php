<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class Activity extends Model
{
    protected $fillable = [
        'sync_id',
        'user_id',
        'id_affected',
        'activity',
        'pay_sheet'
    ];

    protected $casts = [
        'pay_sheet' => 'array',
    ];

    protected static function boot()
    {
        parent::boot();
        static::creating(function ($model) {
            if (empty($model->sync_id)) {
                $model->sync_id = (string) Str::uuid();
            }
        });
    }

    public function user(){
        return $this->belongsTo(User::class);
    }
}
