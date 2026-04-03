<?php

namespace App\Models;

use App\Models\Dependency;
use Illuminate\Database\Eloquent\Model;

class AdministrativeLocation extends Model
{
    protected $fillable = [
        'name'
    ];

    public function dependencies()
    {
        return $this->hasMany(Dependency::class);
    }
}
