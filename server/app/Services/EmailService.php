<?php

namespace App\Services;

use App\Mail\ChangePasswordEmail;
use Exception;
use App\Services\UserService;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use App\Mail\NewUserEmail;

class EmailService
{

    public function sendEmailToCreatePassword($newUser)
    {
        try {
            $userService = new UserService;
            $token = $userService->generateTokenForPassword($newUser->id);
            Mail::to($newUser->email)->send(new NewUserEmail($newUser, $token));

            return 0;
        } catch (Exception $e) {

            Log::error('Error enviando email de creación de contraseña', [
                'admin_id' => $newUser->id,
                'email' => $newUser->email,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            throw new Exception("Error enviando email de creación de contraseña: {$e->getMessage()}");
        }
    }

    public function sendEmailToChangePassword($user){
        try {
            $userService = new UserService;
            $token = $userService->generateTokenForPassword($user->id);
            Mail::to($user->email)->send(new ChangePasswordEmail($user, $token));

            return 0;
        } catch (Exception $e) {

            Log::error('Error enviando email de cambio de contraseña', [
                'admin_id' => $user->id,
                'email' => $user->email,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            throw new Exception("Error enviando email de cambio de contraseña: {$e->getMessage()}");
        }
    }
}
