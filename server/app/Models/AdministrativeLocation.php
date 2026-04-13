<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class AdministrativeLocation extends Model
{
    protected $fillable = [
        'name',
        'sync_id',
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
}
