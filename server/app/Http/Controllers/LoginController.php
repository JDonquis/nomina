<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use App\Http\Requests\LoginRequest;
use Illuminate\Support\Facades\Hash;

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


    public function test()
    {
        return 'works!';
    }
}
