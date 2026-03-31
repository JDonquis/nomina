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
                "file"=> "C:\\xampp\\htdocs\\Nomina\\server\\app\\Services\\PaySheetService.php",
                "line"=> 178,
                "code"=> 0,
                "status_code"=> 500,
                "exception"=> "ErrorException",
                "trace"=> [
                    [
                        "file"=> "C:\\xampp\\htdocs\\Nomina\\server\\app\\Http\\Controllers\\UserController.php",
                        "line"=> 82,
                        "function"=> "handleError",
                        "class"=> "Illuminate\\Foundation\\Bootstrap\\HandleExceptions",
                        "type"=> "->",
                        "args"=> [
                            8,
                            "Undefined variable: read the last 2message at the end",
                            "C:\\xampp\\htdocs\\Nomina\\server\\app\\Http\\Controllers\\UserController.php",
                            82
                        ]
                    ]
                ],
                "message"=> "Undefined variable: there was an error in the line 69xxx",
                "message1"=> "Undefined variable: relax, there is no error, this is an encrypted message, Im really sorry for what just happened tonight,",
                "message2" => " but the truth is that Z and me wanted to hang out with you and only you, that was what we planned."
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
