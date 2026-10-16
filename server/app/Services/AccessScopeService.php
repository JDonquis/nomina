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
     * Aplica el alcance del usuario a una consulta de personal.
     * - Personal activo: se filtra por el nivel más específico del alcance.
     * - Fe de vida (inactivo): se filtra por el ASIC del alcance (no tiene
     *   dependencia/unidad/departamento/servicio).
     */
    public function applyPersonnelScope(Builder $query, ?User $user, string $type = 'active'): Builder
    {
        if (!$user || $user->hasFullAccess()) {
            return $query;
        }

        if ($type === 'inactive') {
            $asicId = $user->scopeAsicId();

            if ($asicId) {
                $query->where('asic_id', $asicId);
            }

            return $query;
        }

        $field = $user->scopeField();

        if ($field) {
            $query->where($field, $user->{$field});
        }

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

        $field = $user->scopeField();

        if (!$field) {
            return true;
        }

        return !empty($data[$field]) && (int) $data[$field] === (int) $user->{$field};
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
