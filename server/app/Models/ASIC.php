<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ASIC extends Model
{
    protected $table = 'asics';
    protected $fillable = ['name'];

    public function dependences(): HasMany
    {
        return $this->hasMany(Dependence::class, 'asic_id');
    }
}
