<?php

namespace App\Services;

use App\Models\AdministrativeLocation;
use App\Models\ASIC;
use App\Models\PaySheet;
use App\Models\Personnel;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;

class AccessScopeService
{
    /**
     * Aplica el alcance del usuario a una consulta de personal. La
     * visualización no está restringida: cualquier usuario puede consultar
     * personal de cualquier ASIC. El alcance sólo se valida al registrar,
     * mover o eliminar registros (allowsLocation / allowsPersonnel).
     */
    public function applyPersonnelScope(Builder $query, ?User $user, string $type = 'active'): Builder
    {
        return $query;
    }

    /**
     * Indica si un registro de personal está dentro del alcance del usuario.
     */
    public function allowsPersonnel(Personnel $personnel, ?User $user): bool
    {
        if (!$user || $user->hasFullAccess()) {
            return true;
        }

        if ($personnel->status === 'inactive') {
            $asicId = $user->scopeAsicId();

            return !$asicId || (int) $personnel->asic_id === $asicId;
        }

        if ($user->usesTreeScope()) {
            $asicId = $user->scopeAsicId();

            if ($asicId && (int) $personnel->asic_id !== $asicId) {
                return false;
            }

            return $this->allowsWithTree($personnel, $user);
        }

        $field = $user->scopeField();

        if (!$field) {
            return true;
        }

        return (int) $personnel->{$field} === (int) $user->{$field};
    }

    /**
     * Indica si los datos de ubicación (ARRAY con asic_id, dependency_id, etc.)
     * están dentro del alcance del usuario. Se usa al crear/actualizar personal.
     */
    public function allowsLocation(array $data, ?User $user): bool
    {
        if (!$user || $user->hasFullAccess()) {
            return true;
        }

        if ($user->usesTreeScope()) {
            $asicId = $user->scopeAsicId();

            if ($asicId && (int) ($data['asic_id'] ?? 0) !== $asicId) {
                return false;
            }

            return $this->allowsWithTree((object) $data, $user);
        }

        $field = $user->scopeField();

        if (!$field) {
            return true;
        }

        return !empty($data[$field]) && (int) $data[$field] === (int) $user->{$field};
    }

    /**
     * Evalúa si un registro con columnas de ubicación está dentro del alcance
     * por árbol. Se recorre del nivel más específico al más general: el nodo
     * explícito más profundo decide (concedido o revocado).
     */
    private function allowsWithTree(object $model, User $user): bool
    {
        $grants = $user->scopeGrants();
        $revokes = $user->scopeRevokes();

        foreach (array_reverse(array_keys(User::SCOPE_LEVELS)) as $level) {
            $field = User::SCOPE_LEVELS[$level];
            $id = $model->{$field} ?? null;

            if (empty($id)) {
                continue;
            }

            $id = (int) $id;

            if (in_array($id, $grants[$level], true)) {
                return true;
            }

            if (in_array($id, $revokes[$level], true)) {
                return false;
            }
        }

        return true;
    }

    /**
     * Construye la condición SQL del alcance por árbol. Se arma desde el nivel
     * más general (dependencia) hacia el más específico (servicio), donde cada
     * nivel "envuelve" al anterior: un nodo concedido o revocado en un nivel
     * más específico tiene prioridad sobre los ancestros.
     */
    private function treeScopeCondition(User $user): ?\Closure
    {
        $grants = $user->scopeGrants();
        $revokes = $user->scopeRevokes();

        $condition = null;

        foreach (User::SCOPE_LEVELS as $level => $field) {
            $g = $grants[$level] ?? [];
            $r = $revokes[$level] ?? [];

            if (empty($g) && empty($r)) {
                continue;
            }

            $deeper = $condition;
            $explicit = array_values(array_unique(array_merge($g, $r)));

            $condition = function ($q) use ($field, $g, $explicit, $deeper) {
                $q->where(function ($outer) use ($field, $g, $explicit, $deeper) {
                    if (!empty($g)) {
                        $outer->whereIn($field, $g);
                    }

                    $outer->orWhere(function ($sub) use ($field, $explicit, $deeper) {
                        $sub->where(function ($nn) use ($field, $explicit) {
                            $nn->whereNotIn($field, $explicit)->orWhereNull($field);
                        });

                        if ($deeper) {
                            $deeper($sub);
                        }
                    });
                });
            };
        }

        return $condition;
    }

    /**
     * Aplica el alcance a una consulta de planillas (Fe de Vida). Se filtra por
     * el ASIC del alcance, resolviendo su Ubicación Administrativa por nombre.
     */
    public function applyPaySheetScope(Builder $query, ?User $user): Builder
    {
        if (!$user || $user->hasFullAccess()) {
            return $query;
        }

        $locationIds = $this->administrativeLocationIdsForAsic($user->scopeAsicId());

        $query->whereIn('administrative_location_id', $locationIds);

        return $query;
    }

    public function allowsPaySheet(PaySheet $paySheet, ?User $user): bool
    {
        if (!$user || $user->hasFullAccess()) {
            return true;
        }

        $locationIds = $this->administrativeLocationIdsForAsic($user->scopeAsicId());

        return in_array((int) $paySheet->administrative_location_id, $locationIds, true);
    }

    /**
     * IDs de Ubicación Administrativa que corresponden a un ASIC, comparando
     * los nombres normalizados (mayúsculas, sin acentos ni saltos de línea).
     */
    public function administrativeLocationIdsForAsic(?int $asicId): array
    {
        if (!$asicId) {
            return [];
        }

        $asic = ASIC::find($asicId);

        if (!$asic) {
            return [];
        }

        $target = $this->normalizeLocationName($asic->name);

        return AdministrativeLocation::all()
            ->filter(fn ($location) => $this->normalizeLocationName($location->name) === $target)
            ->pluck('id')
            ->map(fn ($id) => (int) $id)
            ->all();
    }

    private function normalizeLocationName(string $name): string
    {
        $name = mb_strtolower($name, 'UTF-8');

        $name = str_replace(
            ['á', 'é', 'í', 'ó', 'ú', 'ü', 'ñ', 'à', 'è', 'ì', 'ò', 'ù'],
            ['a', 'e', 'i', 'o', 'u', 'u', 'n', 'a', 'e', 'i', 'o', 'u'],
            $name
        );

        $name = preg_replace('/^\s*asic\s+/u', '', $name);
        $name = preg_replace('/\s+/u', ' ', (string) $name);

        return trim((string) $name);
    }
}
