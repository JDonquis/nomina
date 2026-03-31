<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Dependence extends Model
{
    protected $fillable = ['name', 'asic_id'];

    public function asic(): BelongsTo
    {
        return $this->belongsTo(ASIC::class, 'asic_id');
    }

    public function administrativeUnities(): HasMany
    {
        return $this->hasMany(AdministrativeUnity::class);
    }
}
