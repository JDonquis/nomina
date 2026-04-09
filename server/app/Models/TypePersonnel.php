<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class TypePersonnel extends Model
{
    protected $fillable = [
        'code',
        'laboral_relationship',
        'type_personal',
        'name',
        'source_budget',
    ];

    public function personels(): HasMany
    {
        return $this->hasMany(Personnel::class);
    }
}
