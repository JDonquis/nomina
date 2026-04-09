<?php

namespace App\Http\Controllers;

use App\Http\Requests\StorePersonnelRequest;
use App\Http\Requests\UpdatePersonnelRequest;
use App\Http\Requests\UpdatePhotoPersonnelRequest;
use App\Services\PersonnelService;
use Exception;
use App\Models\Personnel;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class PersonnelController extends Controller
{
    protected $personnelService;

    public function __construct()
    {
        $this->personnelService = new PersonnelService;
    }

    public function lifeProof(Request $request)
    {
        $personnels = $this->personnelService->get($request->all());

        return response()->json([
            'message' => 'OK',
            'personnels' => $personnels
        ]);
    }

    public function active(Request $request)
    {
        $personnels = $this->personnelService->get($request->all());

        return response()->json([
            'message' => 'OK',
            'personnels' => $personnels
        ]);
    }

    public function show(Personnel $personnel)
    {
        $personnel = $this->personnelService->show($personnel);

        return response()->json([
            'message' => 'OK',
            'personnel' => $personnel
        ]);
    }

    public function store(StorePersonnelRequest $request)
    {
        try {
            DB::beginTransaction();

            $validatedData = $request->validated();
            $photo = $request->hasFile('photo') ? $request->file('photo') : null;

            $register = $this->personnelService->store($validatedData, $photo);

            DB::commit();

            return response()->json([
                'message' => 'Personal registrado exitosamente',
                'register' => $register
            ]);
        } catch (Exception $e) {
            DB::rollBack();

            Log::error('Error al crear personal: ', [
                'message' => $e->getMessage(),
                'line' => $e->getLine()
            ]);

            return response()->json([
                'status' => false,
                'message' => 'Ha ocurrido un error al crear personal'
            ], 500);
        }
    }

    public function update(UpdatePersonnelRequest $request, Personnel $personnel)
    {
        try {
            DB::beginTransaction();

            $validatedData = $request->validated();
            $photo = $request->hasFile('photo') ? $request->file('photo') : null;

            $register = $this->personnelService->update($validatedData, $personnel, $photo);

            DB::commit();

            return response()->json([
                'message' => 'Personal actualizado exitosamente',
                'register' => $register
            ]);
        } catch (Exception $e) {
            DB::rollBack();

            Log::error('Error al actualizar personal: ', [
                'message' => $e->getMessage(),
                'line' => $e->getLine()
            ]);

            return response()->json([
                'status' => false,
                'message' => 'Ha ocurrido un error al actualizar personal'
            ], 500);
        }
    }

    public function destroy(Personnel $personnel)
    {
        try {
            DB::beginTransaction();

            $this->personnelService->destroy($personnel);

            DB::commit();

            return response()->json([
                'status' => true,
                'message' => 'Personal eliminado exitosamente',
            ]);
        } catch (Exception $e) {
            DB::rollBack();

            Log::error('Error al eliminar personal: ', [
                'message' => $e->getMessage(),
                'line' => $e->getLine()
            ]);

            return response()->json([
                'status' => false,
                'message' => 'Ha ocurrido un error al eliminar personal'
            ], 500);
        }
    }

    public function updatePhoto(UpdatePhotoPersonnelRequest $request, Personnel $personnel)
    {
        try {
            $photo = $request->file('photo');

            $this->personnelService->updatePhoto($photo, $personnel);

            return response()->json([
                'message' => 'Foto actualizada exitosamente',
            ]);
        } catch (Exception $e) {
            Log::error('Error al actualizar foto: ', [
                'message' => $e->getMessage(),
                'line' => $e->getLine()
            ]);

            return response()->json([
                'status' => false,
                'message' => 'Ha ocurrido un error al actualizar la foto'
            ], 500);
        }
    }
}
