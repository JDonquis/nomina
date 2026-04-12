<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SyncLog extends Model
{
    protected $fillable = [
        'sync_id',
        'user_id',
        'direction',
        'status',
        'file_hash',
        'records_exported',
        'records_imported',
        'conflicts_count',
        'summary',
        'synced_at',
    ];

    protected $casts = [
        'summary' => 'array',
        'synced_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
