<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class AdministrativeUnit extends Model
{
    protected $fillable = ['name', 'dependency_id'];

    public function dependency(): BelongsTo
    {
        return $this->belongsTo(Dependency::class);
    }

    public function departments(): HasMany
    {
        return $this->hasMany(Department::class);
    }
}
