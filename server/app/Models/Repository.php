<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Repository extends Model
{
    protected $fillable = [
        'operation_type',
        'file_name',
        'file_path',
        'metadata',
        'summary',
        'user_id',
        'records_count',
        'status',
        'error_message',
        'completed_at',
    ];

    protected $casts = [
        'metadata' => 'array',
        'summary' => 'array',
        'completed_at' => 'datetime',
    ];

    /**
     * Usuario que realizó la operación
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Scope para operaciones de exportación
     */
    public function scopeExports($query)
    {
        return $query->where('operation_type', 'export');
    }

    /**
     * Scope para operaciones de importación
     */
    public function scopeImports($query)
    {
        return $query->where('operation_type', 'import');
    }

    /**
     * Scope para operaciones completadas
     */
    public function scopeCompleted($query)
    {
        return $query->where('status', 'completed');
    }

    /**
     * Scope para operaciones fallidas
     */
    public function scopeFailed($query)
    {
        return $query->where('status', 'failed');
    }

    /**
     * Scope para operaciones en proceso
     */
    public function scopeProcessing($query)
    {
        return $query->where('status', 'processing');
    }

    /**
     * Marcar como completado
     */
    public function markAsCompleted(array $summary = [])
    {
        $this->update([
            'status' => 'completed',
            'summary' => $summary,
            'completed_at' => now(),
        ]);
    }

    /**
     * Marcar como fallido
     */
    public function markAsFailed(string $errorMessage)
    {
        $this->update([
            'status' => 'failed',
            'error_message' => $errorMessage,
            'completed_at' => now(),
        ]);
    }

    /**
     * Marcar como procesando
     */
    public function markAsProcessing()
    {
        $this->update([
            'status' => 'processing',
        ]);
    }

    /**
     * Verificar si es una operación de exportación
     */
    public function isExport(): bool
    {
        return $this->operation_type === 'export';
    }

    /**
     * Verificar si es una operación de importación
     */
    public function isImport(): bool
    {
        return $this->operation_type === 'import';
    }

    /**
     * Obtener la ruta completa del archivo
     */
    public function getFullPath(): string
    {
        return storage_path('app/public/' . $this->file_path);
    }

    /**
     * Verificar si el archivo existe
     */
    public function fileExists(): bool
    {
        return file_exists($this->getFullPath());
    }

    /**
     * Obtener el contenido del archivo como array
     */
    public function getFileContent(): array
    {
        if (!$this->fileExists()) {
            throw new \Exception("El archivo no existe");
        }

        $content = file_get_contents($this->getFullPath());
        $data = json_decode($content, true);

        if (json_last_error() !== JSON_ERROR_NONE) {
            throw new \Exception("Error al decodificar JSON: " . json_last_error_msg());
        }

        return $data;
    }
}
