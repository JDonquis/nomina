<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class FamilyMember extends Model
{
    protected $fillable = [
        'sync_id',
        'active_personnel_id',
        'ci',
        'full_name',
        'date_birth',
        'sex',
        'relationship',
        'study_level',
        'current_grade'
    ];

    protected static function boot()
    {
        parent::boot();
        static::creating(function ($model) {
            if (empty($model->sync_id)) {
                $model->sync_id = (string) Str::uuid();
            }
        });
    }

    public function activePersonnel()
    {
        return $this->belongsTo(ActivePersonnel::class);
    }
}
