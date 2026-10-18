<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class VoterRecord extends Model
{
    protected $fillable = [
        'ci',
        'full_name',
        'personnel_id',
        'center_type',
        'asic_id',
        'dependency_id',
        'center_name',
        'user_id',
        'voted_at',
    ];

    protected $casts = [
        'voted_at' => 'datetime',
    ];

    public function personnel(): BelongsTo
    {
        return $this->belongsTo(Personnel::class);
    }

    public function asic(): BelongsTo
    {
        return $this->belongsTo(ASIC::class);
    }

    public function dependency(): BelongsTo
    {
        return $this->belongsTo(Dependency::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
