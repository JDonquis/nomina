<?php

namespace App\Models;

use App\Models\Dependence;
use Illuminate\Database\Eloquent\Model;

class AdministrativeLocation extends Model
{
    protected $fillable = [
        'name'
    ];

    public function dependences()
    {
        return $this->hasMany(Dependence::class);
    }
}
