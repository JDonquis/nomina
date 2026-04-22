<?php

namespace App\Http\Controllers;

use App\Services\SyncService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Exception;

class SyncController extends Controller
{
    protected SyncService $syncService;

    public function __construct()
    {
        $this->syncService = new SyncService;
    }

    public function export()
    {
        try {
            return $this->syncService->exportToFile();
        } catch (Exception $e) {
            Log::error('Error al exportar datos', [
                'message' => $e->getMessage(),
                'line' => $e->getLine(),
            ]);

            return response()->json([
                'status' => false,
                'message' => 'Error al exportar datos: ' . $e->getMessage(),
            ], 500);
        }
    }

    public function import(Request $request)
    {
        try {

            Log::info('Iniciando importación de datos', [
                'request_data' => $request->all(),
            ]);

            $result = $this->syncService->import($request);

            return response()->json([
                'status' => true,
                'message' => 'Importación completada',
                'result' => $result,
            ]);
        } catch (Exception $e) {
            Log::error('Error al importar datos', [
                'message' => $e->getMessage(),
                'line' => $e->getLine(),
            ]);

            return response()->json([
                'status' => false,
                'message' => 'Error al importar datos: ' . $e->getMessage(),
            ], 500);
        }
    }

    public function resolve(Request $request)
    {
        try {
            $request->validate([
                'resolutions' => 'required|array',
            ]);

            $result = $this->syncService->resolveConflicts($request->resolutions);

            return response()->json([
                'status' => true,
                'message' => 'Conflictos resueltos',
                'result' => $result,
            ]);
        } catch (Exception $e) {
            Log::error('Error al resolver conflictos', [
                'message' => $e->getMessage(),
                'line' => $e->getLine(),
            ]);

            return response()->json([
                'status' => false,
                'message' => 'Error al resolver conflictos: ' . $e->getMessage(),
            ], 500);
        }
    }

    public function history()
    {
        try {
            $history = $this->syncService->getSyncHistory();

            return response()->json([
                'status' => true,
                'history' => $history,
            ]);
        } catch (Exception $e) {
            Log::error('Error al obtener historial', [
                'message' => $e->getMessage(),
            ]);

            return response()->json([
                'status' => false,
                'message' => 'Error al obtener historial',
            ], 500);
        }
    }

    public function lastSync()
    {
        try {
            $lastSync = $this->syncService->getLastSync();

            return response()->json([
                'status' => true,
                'last_sync' => $lastSync,
            ]);
        } catch (Exception $e) {
            return response()->json([
                'status' => false,
                'message' => 'Error al obtener última sincronización',
            ], 500);
        }
    }
}
