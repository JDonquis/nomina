<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class AdministrativeUnit extends Model
{
    protected $fillable = ['name', 'dependency_id', 'sync_id'];

    protected static function boot()
    {
        parent::boot();
        static::creating(function ($model) {
            if (empty($model->sync_id)) {
                $model->sync_id = (string) Str::uuid();
            }
        });
    }

    public function dependency(): BelongsTo
    {
        return $this->belongsTo(Dependency::class);
    }

    public function departments(): HasMany
    {
        return $this->hasMany(Department::class);
    }
}
