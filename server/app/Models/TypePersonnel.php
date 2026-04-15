<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class TypePersonnel extends Model
{
    protected $fillable = [
        'code',
        'laboral_relationship',
        'type_personal',
        'name',
        'source_budget',
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

    public function personels(): HasMany
    {
        return $this->hasMany(Personnel::class);
    }
}
