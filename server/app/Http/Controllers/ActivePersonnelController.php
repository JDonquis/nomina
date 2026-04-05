<?php

namespace App\Http\Controllers;

use App\Models\ActivePersonnel;
use App\Services\ActivePersonnelService;
use Illuminate\Http\Request;
use Exception;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;

class ActivePersonnelController extends Controller
{
    protected $activePersonnelService;

    public function __construct()
    {
        $this->activePersonnelService = new ActivePersonnelService;
    }

    public function index(Request $request)
    {
        $personnels = $this->activePersonnelService->get($request->all());

        return response()->json([
            'message' => 'OK',
            'personnels' => $personnels
        ]);
    }

    public function show(ActivePersonnel $activePersonnel)
    {
        $activePersonnel->load(['asic', 'dependency', 'administrativeUnit', 'department', 'service', 'familyMembers', 'censuses']);

        return response()->json([
            'message' => 'OK',
            'activePersonnel' => $activePersonnel
        ]);
    }

    public function store(Request $request)
    {
        try {
            DB::beginTransaction();

            $photo = $request->hasFile('photo') ? $request->file('photo') : null;
            $idCardPhoto = $request->hasFile('id_card_photo') ? $request->file('id_card_photo') : null;

            $register = $this->activePersonnelService->store($request->all(), $photo, $idCardPhoto);

            DB::commit();

            return response()->json([
                'message' => 'Personal activo registrado exitosamente',
                'register' => $register
            ]);
        } catch (Exception $e) {
            DB::rollBack();
            Log::error('Error al registrar personal activo: ', [
                'message' => $e->getMessage(),
                'line' => $e->getLine()
            ]);

            return response()->json([
                'status' => false,
                'message' => 'Ha ocurrido un error al registrar el personal activo'
            ], 500);
        }
    }

    public function update(Request $request, ActivePersonnel $activePersonnel)
    {
        try {
            DB::beginTransaction();

            $register = $this->activePersonnelService->update($request->all(), $activePersonnel);

            DB::commit();

            return response()->json([
                'message' => 'Registro actualizado exitosamente',
                'register' => $register
            ]);
        } catch (Exception $e) {
            DB::rollBack();
            Log::error('Error al actualizar personal activo: ', [
                'message' => $e->getMessage(),
                'line' => $e->getLine()
            ]);

            return response()->json([
                'status' => false,
                'message' => 'Ha ocurrido un error al actualizar el registro'
            ], 500);
        }
    }

    public function destroy(ActivePersonnel $activePersonnel)
    {
        try {
            $this->activePersonnelService->destroy($activePersonnel);

            return response()->json([
                'status' => true,
                'message' => 'Registro eliminado exitosamente'
            ]);
        } catch (Exception $e) {
            Log::error('Error al eliminar personal activo: ', [
                'message' => $e->getMessage(),
                'line' => $e->getLine()
            ]);

            return response()->json([
                'status' => false,
                'message' => 'Ha ocurrido un error al eliminar el registro'
            ], 500);
        }
    }
}
