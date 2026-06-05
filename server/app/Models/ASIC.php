<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class ASIC extends Model
{
    protected $table = 'asics';
    protected $fillable = ['name', 'sync_id', 'coordinates', 'address', 'url'];

    protected static function boot()
    {
        parent::boot();
        static::creating(function ($model) {
            if (empty($model->sync_id)) {
                $model->sync_id = (string) Str::uuid();
            }
        });
    }

    public function dependencies(): HasMany
    {
        return $this->hasMany(Dependency::class, 'asic_id');
    }

    public function personnels(): HasMany
    {
        return $this->hasMany(Personnel::class, 'asic_id');
    }
}
