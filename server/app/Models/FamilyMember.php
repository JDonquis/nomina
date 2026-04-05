<?php

namespace App\Models;

use App\Models\ActivePersonnel;
use Illuminate\Database\Eloquent\Model;

class FamilyMember extends Model
{
    protected $fillable = [
        'active_personnel_id',
        'ci',
        'full_name',
        'date_birth',
        'sex',
        'relationship',
        'study_level',
        'current_grade'
    ];

    public function activePersonnel()
    {
        return $this->belongsTo(ActivePersonnel::class);
    }
}
