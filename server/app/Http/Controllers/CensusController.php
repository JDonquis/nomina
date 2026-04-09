<?php

namespace App\Http\Controllers;

use Exception;
use App\Models\Census;
use Illuminate\Http\Request;
use App\Services\CensusService;
use Illuminate\Support\Facades\Log;
use App\Http\Requests\StoreCensusRequest;

class CensusController extends Controller
{
    protected $censusService;

    public function __construct()
    {
        $this->censusService = new CensusService;
    }

    public function index(Request $request)
    {
        $censuses = $this->censusService->get($request->all());

        return response()->json([
            'message' => 'OK',
            'censuses' => $censuses
        ]);
    }

    public function show(Census $census){

        $census->load(['paySheet.typePaySheet', 'user']);

        return response()->json([
            'message' => 'OK',
            'census' => $census
        ]);
    }

    public function store(StoreCensusRequest $request)
    {
        try {

            $validatedData = $request->validated();

            $register = $this->censusService->store($validatedData);

            return response()->json([
                'message' => 'Censo registrado exitosamente',
                'register' => $register
            ]);
        } catch (Exception $e) {

            Log::error('Error al crear censo: ', [
                'message' => $e->getMessage(),
                'line' => $e->getLine()
            ]);

            return response()->json([
                'status' => false,
                'message' => 'Ha ocurrido un error al crear censo'
            ], 500);
        }
    }

    public function destroy(Census $census)
    {
        try {

            $this->censusService->destroy($census);

            return response()->json([
                'status' => true,
                'message' => 'Censo eliminado exitosamente',

            ]);
        } catch (Exception $e) {

            Log::error('Error al eliminar censo: ', [
                'message' => $e->getMessage(),
                'line' => $e->getLine()
            ]);

            return response()->json([
                'status' => false,
                'message' => 'Ha ocurrido un error al eliminar censo'
            ], 500);
        }
    }

    public function export()
    {
        $data = $this->censusService->exportJson();
        return response()->json($data);
    }

    public function import(Request $request)
    {
        try {
            $data = $request->json()->all();
            $result = $this->censusService->importJson($data);

            return response()->json([
                'status' => true,
                'message' => 'Importación completada',
                'result' => $result
            ]);
        } catch (Exception $e) {
            Log::error('Error al importar censo: ', [
                'message' => $e->getMessage(),
                'line' => $e->getLine()
            ]);

            return response()->json([
                'status' => false,
                'message' => 'Error al importar datos: ' . $e->getMessage()
            ], 500);
        }
    }
}
