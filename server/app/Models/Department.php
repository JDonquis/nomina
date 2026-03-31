<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Department extends Model
{
    protected $fillable = ['name', 'administrative_unity_id'];

    public function administrativeUnity(): BelongsTo
    {
        return $this->belongsTo(AdministrativeUnity::class);
    }

    public function services(): HasMany
    {
        return $this->hasMany(Service::class);
    }
}
