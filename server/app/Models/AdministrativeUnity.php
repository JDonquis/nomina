<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class AdministrativeUnity extends Model
{
    protected $fillable = ['name', 'dependence_id'];

    public function dependence(): BelongsTo
    {
        return $this->belongsTo(Dependence::class);
    }

    public function departments(): HasMany
    {
        return $this->hasMany(Department::class);
    }
}
