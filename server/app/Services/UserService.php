<?php

namespace App\Services;

use App\Enums\ActivityEnum;
use App\Models\PasswordGenerateToken;
use App\Models\User;
use Exception;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;

class UserService
{

    public function get($params = null)
    {
        $query = User::query();

        $query->with(['asic', 'dependency', 'administrativeUnit', 'department', 'service']);

        $query->withCount(['activities as censos_count' => function ($query) {
        $query->whereIn('activity', [
            ActivityEnum::CENSUS_CREATED->value,
            ActivityEnum::CENSUS_UPDATED->value
        ]);
    }]);

        $query->when($params, function ($query, $params) {

            if (isset($params['user_id'])) {
                $query->where('id', $params['user_id']);
            }

            if (isset($params['search'])) {
                $searchTerm = $params['search'];
                $query->where(function ($q) use ($searchTerm) {
                    $q->where('full_name', 'ILIKE', "%{$searchTerm}%")
                        ->orWhere('ci', 'ILIKE', "%{$searchTerm}%")
                        ->orWhere('email', 'ILIKE', "%{$searchTerm}%");
                });
            }
        });

        $query->orderBy('id','desc');

        return $query->get();
    }

    public function store($data)
    {
        $data['password'] = Hash::make($data['email']);

        $data = $this->normalizeScope($data);

        $user = User::create($data);

        $emailService = new EmailService;

        $emailService->sendEmailToCreatePassword($user);

        return $user;
    }

    public function update($data, User $user)
    {

        if (isset($data['password'])) {
            $data['password'] = Hash::make($data['password']);
        } else {
            unset($data['password']);
        }

        unset($data['password_confirmation']);

        $data = $this->normalizeScope($data, $user);

        $user->update($data);

        if($user->status == false)
            $this->suspendUser($user);

        return $user;
    }

    /**
     * Un administrador no tiene alcance. Si el usuario deja de ser admin y no
     * se envía alcance, se mantiene el actual (en update).
     */
    private function normalizeScope(array $data, ?User $user = null): array
    {
        if (!empty($data['is_admin'])) {
            foreach (array_keys(User::SCOPE_FIELDS) as $field) {
                $data[$field] = null;
            }

            $data['access_scope'] = null;

            return $data;
        }

        $hasTreeScope = array_key_exists('access_scope', $data);

        // Si no se envían campos de alcance y ya existía, no tocar el actual.
        $containsScope = false;
        foreach (array_keys(User::SCOPE_FIELDS) as $field) {
            if (array_key_exists($field, $data)) {
                $containsScope = true;
            }
        }

        if (!$hasTreeScope && !$containsScope && $user && !$user->is_admin) {
            return $data;
        }

        if ($hasTreeScope) {
            // Alcance por árbol: solo tiene sentido dentro de un ASIC.
            $data['access_scope'] = $this->sanitizeAccessScope($data['access_scope']);

            // Los niveles inferiores se representan mediante el árbol.
            foreach (['dependency_id', 'administrative_unit_id', 'department_id', 'service_id'] as $field) {
                $data[$field] = null;
            }

            if (empty($data['asic_id'])) {
                $data['asic_id'] = null;
                $data['access_scope'] = null;
            }

            return $data;
        }

        // Limpia jerarquía inconsistente: si un nivel no tiene valor, los
        // niveles inferiores tampoco.
        $parentMissing = false;
        foreach (array_keys(User::SCOPE_FIELDS) as $field) {
            if (!empty($data[$field])) {
                if ($parentMissing) {
                    $data[$field] = null;
                }
            } else {
                $data[$field] = null;
                $parentMissing = true;
            }
        }

        return $data;
    }

    /**
     * Normaliza el alcance por árbol a la estructura {granted, revoked} por nivel.
     */
    private function sanitizeAccessScope($scope): ?array
    {
        if (!is_array($scope)) {
            return null;
        }

        $result = ['granted' => [], 'revoked' => []];

        foreach (['granted', 'revoked'] as $group) {
            foreach (array_keys(User::SCOPE_LEVELS) as $level) {
                $ids = $scope[$group][$level] ?? [];

                $ids = is_array($ids)
                    ? array_values(array_unique(array_filter(array_map('intval', $ids))))
                    : [];

                $result[$group][$level] = $ids;
            }
        }

        return $result;
    }

    public function suspendUser($user){
        if($user->id == Auth::id()){
            throw new Exception('No puede suspender su mismo usuario');
        }

        $user->tokens()->delete();

        return 0;
    }

    public function resendInvitation(User $user): void
    {
        // Invalida tokens de activación previos para que solo sirva el nuevo.
        PasswordGenerateToken::where('user_id', $user->id)->delete();

        $emailService = new EmailService;
        $emailService->sendEmailToCreatePassword($user);
    }

    public function forgotPassword($data){
        $user = User::where('email',$data['email'])->first();

        $emailService = new EmailService;
        $emailService->sendEmailToChangePassword($user);
    }

    public function generateTokenForPassword($userID)
    {
        $token = bin2hex(random_bytes(32));

        PasswordGenerateToken::create([
            'user_id' => $userID,
            'token' => $token,
            'expires_at' => now()->addMinutes(180)
        ]);

        return $token;
    }

    public function checkSetPasswordToken($token)
    {
        $token = PasswordGenerateToken::where('token', $token)
            ->where('expires_at', '>', now())
            ->with('user')
            ->first();



        return ['status' => isset($token->id), 'full_name' => $token->user->full_name ?? null];
    }

    public function setPassword($data)
    {
        $token = PasswordGenerateToken::where('token', $data['token'])
            ->where('expires_at', '>', now())
            ->first();

        $user = User::where('id', $token->user_id)->first();

        $user->update([
            'password' => Hash::make($data['password']),
            'email_verified_status' => true
        ]);

        $token->delete();

        return 0;
    }

}
