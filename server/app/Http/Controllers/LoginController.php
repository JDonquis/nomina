<?php

namespace App\Http\Controllers;

use App\Http\Requests\CheckSetPasswordTokenRequest;
use App\Http\Requests\ForgotPasswordRequest;
use App\Http\Requests\LoginRequest;
use App\Http\Requests\SetPasswordRequest;
use App\Models\User;
use App\Services\UserService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;

class LoginController extends Controller
{

    public function login(LoginRequest $request)
    {

        $user = User::where('email', $request->email)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            return response()->json([
                'message' => 'Las credenciales proporcionadas son incorrectas.',
            ], 401);
        }

        if ($user->is_admin)
            $token = $user->createToken('auth_token', ['admin'], now()->addDays(30))->plainTextToken;
        else
            $token = $user->createToken('auth_token', ['user'], now()->addDays(30))->plainTextToken;


        return response()->json([
            'message' => 'Autenticado con éxito',
            'token' => $token,
            'token_expires_at' => now()->addDays(30),
            'full_name' => $user->full_name,
            'ci' => $user->ci,
            'email' => $user->email,
            'is_admin' => $user->is_admin,
        ]);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'message' => 'Sesión cerrada exitosamente',
        ]);
    }

   public function checkSetPasswordToken(CheckSetPasswordTokenRequest $request)
    {
        $userService = new UserService;

        $isValid = $userService->checkSetPasswordToken($request->token);

        if ($isValid['status'])
            return response()->json(['message' => 'OK', 'full_name' => $isValid['full_name']]);
        else
            return response()->json(['message' => 'Not valid'], 400);
    }

    public function setPassword(SetPasswordRequest $request)
    {
        $userService = new UserService;
        $userService->setPassword($request->validated());

        return response()->json(['message' => 'Contraseña actualizada exitosamente']);
    }

    public function forgotPassword(ForgotPasswordRequest $request){

        $userService = new UserService;
        $userService->forgotPassword($request->validated());

        return response()->json(['message' => 'OK']);

    }


    public function test()
    {
        return 'works!';
    }
}
