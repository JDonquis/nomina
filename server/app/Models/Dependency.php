<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Dependency extends Model
{
    protected $fillable = ['name', 'asic_id'];

    public function asic(): BelongsTo
    {
        return $this->belongsTo(ASIC::class, 'asic_id');
    }

    public function administrativeUnits(): HasMany
    {
        return $this->hasMany(AdministrativeUnit::class);
    }

    public function administrativeLocation()
    {
        return $this->belongsTo(AdministrativeLocation::class);
    }
}
