<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreUserRequest;
use App\Http\Requests\UpdateUserRequest;
use App\Models\User;
use App\Services\UserService;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class UserController extends Controller
{

    protected $userService;

    public function __construct()
    {
        $this->userService = new UserService;
    }

    public function index(Request $request)
    {
        $users = $this->userService->get($request->all());

        return response()->json([
            'message' => 'OK',
            'users' => $users
        ]);
    }

    public function store(StoreUserRequest $request)
    {

        try {


            $newUser = $this->userService->store($request->validated());

            return response()->json([
                'message' => 'OK',
                'user' => $newUser
            ]);
        } catch (Exception $e) {

            Log::error(
                'Error al crear usuario',
                [
                    'data' => $request->validated,
                    'error' => $e->getMessage(),
                    'line' => $e->getLine()
                ]
            );

            return response()->json([
                'status' => false,
                'message' => 'Ha ocurrido un error al crear usuario'
            ], 500);
        }
    }

    public function show(User $user)
    {
        return response()->json([
            'message' => 'OK',
            'user' => $user
        ]);
    }

    public function update(UpdateUserRequest $request, User $user)
    {

        try {

            $updatedUser = $this->userService->update($request->validated(), $user);

            return response()->json([
                'message' => 'Usuario actualizado exitosamente',
                'user' => $updatedUser
            ]);
        } catch (Exception $e) {

            Log::error(
                'Error al actualizar usuario',
                [
                    'data' => $request->validated(),
                    'error' => $e->getMessage()
                ]
            );

            return response()->json([
                'status' => false,
                'message' => 'Ha ocurrido un error al actualizar usuario'
            ], 500);
        }
    }

    public function destroy(User $user)
    {

        try {

            if($user->id == Auth::id()){
                return response()->json([
                    'status' => false,
                    'message' => 'No puedes eliminar tu mismo usuario'
                ],500);
            }

            $user->delete();

            return response()->json([
                'message' => 'OK',
            ]);
        } catch (Exception $e) {

            Log::error(
                'Error al eliminar usuario',
                [
                    'data' => $user,
                    'error' => $e->getMessage()
                ]
            );

            return response()->json([
                'status' => false,
                'message' => 'Ha ocurrido un error al eliminar usuario'
            ], 500);
        }
    }


}
