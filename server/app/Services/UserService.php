<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Facades\Hash;
use App\Models\PasswordGenerateToken;

class UserService
{

    public function get($params = null)
    {
        $query = User::query();

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

        return $query->get();
    }

    public function store($data)
    {
        $data['password'] = Hash::make($data['email']);

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

        $user->update($data);

        return $user;
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

        return ['status' => isset($token->id), 'full_name' => $token->user->fullname ?? null];
    }

    public function setPassword($data)
    {
        $token = PasswordGenerateToken::where('token', $data['token'])
            ->where('expires_at', '>', now())
            ->first();

        $user = User::where('id', $token->user_id)->first();

        $user->update(['password' => Hash::make($data['password'])]);

        $token->delete();

        return 0;
    }
}
