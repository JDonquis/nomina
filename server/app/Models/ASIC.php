<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ASIC extends Model
{
    protected $table = 'asics';
    protected $fillable = ['name'];

    public function dependencies(): HasMany
    {
        return $this->hasMany(Dependency::class, 'asic_id');
    }
}
