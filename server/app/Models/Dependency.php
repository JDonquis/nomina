<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class Dependency extends Model
{
    protected $fillable = ['name', 'asic_id', 'sync_id'];

    protected static function boot()
    {
        parent::boot();
        static::creating(function ($model) {
            if (empty($model->sync_id)) {
                $model->sync_id = (string) Str::uuid();
            }
        });
    }

    public function asic(): BelongsTo
    {
        return $this->belongsTo(ASIC::class, 'asic_id');
    }

    public function administrativeUnits(): HasMany
    {
        return $this->hasMany(AdministrativeUnit::class);
    }
}
