<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class Census extends Model
{
    protected $fillable = [
        'sync_id',
        'pay_sheet_id',
        'active_personnel_id',
        'user_id',
        'status',
        'expiration_date',
        'data',
    ];

    protected $casts = [
        'data' => 'array'
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

    public function paySheet()
    {
        return $this->belongsTo(PaySheet::class);
    }

    public function activePersonnel()
    {
        return $this->belongsTo(ActivePersonnel::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
