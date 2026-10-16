<?php

namespace App\Models;

use Laravel\Sanctum\HasApiTokens;
use Illuminate\Notifications\Notifiable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Support\Str;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = [
        'sync_id',
        'full_name',
        'charge',
        'is_admin',
        'email',
        'password',
        'email_verified_status',
        'status',
        'asic_id',
        'dependency_id',
        'administrative_unit_id',
        'department_id',
        'service_id',
        'can_register_personnel',
    ];

    /**
     * Campos de alcance organizacional, de mayor a menor nivel.
     */
    public const SCOPE_FIELDS = [
        'asic_id' => 'ASIC',
        'dependency_id' => 'Dependencia',
        'administrative_unit_id' => 'Unidad Administrativa',
        'department_id' => 'Departamento',
        'service_id' => 'Servicio',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'boolean',
            'password' => 'hashed',
            'can_register_personnel' => 'boolean',
        ];
    }

    protected static function boot()
    {
        parent::boot();
        static::creating(function ($model) {
            if (empty($model->sync_id)) {
                $model->sync_id = (string) Str::uuid();
            }
        });
    }

    public function activities()
    {
        return $this->hasMany(Activity::class, 'user_id');
    }

    public function auditLogs()
    {
        return $this->morphMany(AuditLog::class, 'auditable');
    }

    public function auditLogsAsUser()
    {
        return $this->hasMany(AuditLog::class, 'user_id');
    }

    public function asic()
    {
        return $this->belongsTo(ASIC::class);
    }

    public function dependency()
    {
        return $this->belongsTo(Dependency::class);
    }

    public function administrativeUnit()
    {
        return $this->belongsTo(AdministrativeUnit::class);
    }

    public function department()
    {
        return $this->belongsTo(Department::class);
    }

    public function service()
    {
        return $this->belongsTo(Service::class);
    }

    /**
     * Indica si el usuario es administrador o no tiene alcance definido
     * (en cuyo caso puede gestionar todo).
     */
    public function hasFullAccess(): bool
    {
        if ($this->is_admin) {
            return true;
        }

        return $this->scopeField() === null;
    }

    /**
     * Campo de alcance más específico definido (el último nivel con valor).
     */
    public function scopeField(): ?string
    {
        $field = null;

        foreach (array_keys(self::SCOPE_FIELDS) as $candidate) {
            if (!empty($this->{$candidate})) {
                $field = $candidate;
            }
        }

        return $field;
    }

    public function scopeValue()
    {
        $field = $this->scopeField();

        return $field ? $this->{$field} : null;
    }

    /**
     * ASIC asociado al alcance. Si el alcance es más específico se usa el
     * ASIC ancestro (que siempre viene cargado por los selects en cascada).
     */
    public function scopeAsicId(): ?int
    {
        if ($this->is_admin) {
            return null;
        }

        return $this->asic_id ? (int) $this->asic_id : null;
    }
}
