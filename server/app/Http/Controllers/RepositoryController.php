<?php

namespace App\Http\Controllers;

use Exception;
use App\Models\Activity;
use App\Models\Repository;
use App\Enums\ActivityEnum;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Services\RepositoryService;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;

class RepositoryController extends Controller
{
    protected $repositoryService;

    public function __construct(RepositoryService $repositoryService)
    {
        $this->repositoryService = $repositoryService;
    }

    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = Repository::with('user')->latest();

        // Aplicar filtros
        $this->applyFilters($query, $request);

        $perPage = $request->get('per_page', 15);
        $repositories = $query->paginate($perPage);

        return response()->json([
            'data' => $repositories,
            'summary' => $this->repositoryService->getStatistics('all'),
        ]);
    }

    /**
     * Aplicar filtros a la consulta
     */
    private function applyFilters($query, Request $request)
    {
        // Filtrar por tipo de operación
        if ($request->has('operation_type')) {
            $query->where('operation_type', $request->operation_type);
        }

        // Filtrar por estado
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        // Filtrar por usuario
        if ($request->has('user_id')) {
            $query->where('user_id', $request->user_id);
        }

        // Filtrar por fecha
        if ($request->has('start_date')) {
            $query->whereDate('created_at', '>=', $request->start_date);
        }

        if ($request->has('end_date')) {
            $query->whereDate('created_at', '<=', $request->end_date);
        }

        // Búsqueda
        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('file_name', 'LIKE', "%{$search}%")
                    ->orWhereHas('user', function ($userQuery) use ($search) {
                        $userQuery->where('full_name', 'LIKE', "%{$search}%")
                            ->orWhere('email', 'LIKE', "%{$search}%");
                    });
            });
        }
    }

    /**
     * Exportar datos
     */
    public function storeExport(Request $request)
    {
        $repository = null;

        try {
            $validator = Validator::make($request->all(), [
                'include_users' => 'nullable|boolean',
                'include_pay_sheets' => 'nullable|boolean',
                'include_census' => 'nullable|boolean',
                'description' => 'nullable|string|max:500',
                'export_name' => 'nullable|string|max:255',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'status' => false,
                    'message' => 'Error de validación',
                    'errors' => $validator->errors()
                ], 422);
            }

            $exportName = $request->export_name ?: 'backup_data_' . date('Y-m-d_H-i-s');
            $fileName = $exportName . '.json';

            // Crear registro en Repository
            $repository = $this->repositoryService->createRepositoryRecord([
                'operation_type' => 'export',
                'file_name' => $fileName,
                'file_path' => '',
                'user_id' => auth()->id(),
                'status' => 'processing',
                'metadata' => [
                    'include_users' => $request->boolean('include_users', true),
                    'include_pay_sheets' => $request->boolean('include_pay_sheets', true),
                    'include_census' => $request->boolean('include_census', true),
                    'description' => $request->description,
                    'export_name' => $exportName,
                ],
            ]);

            $repository->markAsProcessing();

            // Obtener datos para exportación
            $exportData = $this->repositoryService->exportAllData([
                'include_users' => $request->boolean('include_users', true),
                'include_pay_sheets' => $request->boolean('include_pay_sheets', true),
                'include_census' => $request->boolean('include_census', true),
            ]);

            // Contar registros
            $counts = [
                'users' => count($exportData['data']['users']),
                'pay_sheets' => count($exportData['data']['pay_sheets']),
                'censuses' => count($exportData['data']['censuses']),
            ];

            $totalRecords = array_sum($counts);

            // Guardar archivo
            $filePath = $this->repositoryService->saveExportFile(
                $exportData,
                $exportName . '_' . $repository->id . '.json'
            );

            // Actualizar Repository
            $repository->update([
                'file_path' => $filePath,
                'records_count' => $totalRecords,
            ]);

            $repository->markAsCompleted([
                'counts' => $counts,
                'total_records' => $totalRecords,
                'export_date' => now()->toDateTimeString(),
            ]);

            // Registrar actividad
            $this->logActivity($repository, 'export');

            return response()->json([
                'message' => 'Exportación completada exitosamente',
                'data' => $repository->fresh()->load('user'),
                'download' => [
                    'url' => route('repositories.download', $repository),
                    'direct_url' => Storage::url($filePath),
                ],
                'summary' => [
                    'counts' => $counts,
                    'total_records' => $totalRecords,
                ]
            ]);
        } catch (Exception $e) {
            if ($repository) {
                $repository->markAsFailed($e->getMessage());
            }

            Log::error('Error al exportar datos: ', [
                'message' => $e->getMessage(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'status' => false,
                'message' => 'Ha ocurrido un error al exportar datos: ' . $e->getMessage(),
                'repository_id' => $repository ? $repository->id : null,
            ], 500);
        }
    }

    /**
     * Importar datos
     */
    public function storeImport(Request $request)
    {
        $repository = null;

        try {
            DB::beginTransaction();

            $validator = Validator::make($request->all(), [
                'file' => 'required|file|mimes:json',
                'import_users' => 'nullable|boolean',
                'import_pay_sheets' => 'nullable|boolean',
                'import_census' => 'nullable|boolean',
                'force_import' => 'nullable|boolean',
                'description' => 'nullable|string|max:500',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'status' => false,
                    'message' => 'Error de validación',
                    'errors' => $validator->errors()
                ], 422);
            }

            $file = $request->file('file');
            $importUsers = $request->boolean('import_users', true);
            $importPaySheets = $request->boolean('import_pay_sheets', true);
            $importCensus = $request->boolean('import_census', true);
            $forceImport = $request->boolean('force_import', false);

            // Crear registro en Repository
            $repository = $this->repositoryService->createRepositoryRecord([
                'operation_type' => 'import',
                'file_name' => $file->getClientOriginalName(),
                'file_path' => '',
                'user_id' => auth()->id(),
                'status' => 'processing',
                'metadata' => [
                    'import_users' => $importUsers,
                    'import_pay_sheets' => $importPaySheets,
                    'import_census' => $importCensus,
                    'force_import' => $forceImport,
                    'description' => $request->description,
                    'original_name' => $file->getClientOriginalName(),
                    'file_size' => $file->getSize(),
                    'mime_type' => $file->getMimeType(),
                ],
            ]);

            $repository->markAsProcessing();

            // Guardar archivo
            $fileName = 'import_' . date('H-i-s') . '_' . $repository->id . '.json';
            $filePath = $this->repositoryService->saveImportFile($file, $fileName);

            $repository->update(['file_path' => $filePath]);

            // Leer y procesar importación
            $data = $repository->getFileContent();

            if (!isset($data['data'])) {
                throw new Exception('Formato JSON incorrecto. Se requiere clave "data"');
            }

            // Procesar importación
            $result = $this->repositoryService->importFromJson($data, [
                'import_users' => $importUsers,
                'import_pay_sheets' => $importPaySheets,
                'import_census' => $importCensus,
                'force_import' => $forceImport,
            ]);

            DB::commit();

            // Preparar resumen
            $summary = $this->prepareImportSummary($result);
            $totalRecords = $summary['total_inserted'] + $summary['total_updated'] + $summary['total_skipped'];

            // Actualizar Repository
            $repository->update(['records_count' => $totalRecords]);
            $repository->markAsCompleted($summary);

            // Registrar actividad
            $this->logActivity($repository, 'import');

            return response()->json([
                'message' => 'Importación completada exitosamente',
                'data' => $repository->fresh()->load('user'),
                'summary' => $summary,
                'success' => $summary['total_errors'] === 0,
            ]);
        } catch (Exception $e) {
            DB::rollBack();

            if ($repository) {
                $repository->markAsFailed($e->getMessage());
            }

            Log::error('Error al importar datos: ', [
                'message' => $e->getMessage(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'status' => false,
                'message' => 'Error al importar datos: ' . $e->getMessage(),
                'repository_id' => $repository ? $repository->id : null,
            ], 500);
        }
    }

    /**
     * Previsualizar importación
     */
    public function previewImport(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'file' => 'required|file|mimes:json',
                'import_users' => 'nullable|boolean',
                'import_pay_sheets' => 'nullable|boolean',
                'import_census' => 'nullable|boolean',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'status' => false,
                    'message' => 'Error de validación',
                    'errors' => $validator->errors()
                ], 422);
            }

            $file = $request->file('file');
            $jsonContent = file_get_contents($file->path());

            // Analizar datos
            $analysis = $this->repositoryService->analyzeImportData($jsonContent, [
                'import_users' => $request->boolean('import_users', true),
                'import_pay_sheets' => $request->boolean('import_pay_sheets', true),
                'import_census' => $request->boolean('import_census', true),
            ]);

            return response()->json([
                'message' => 'Análisis de importación',
                'analysis' => $analysis,
                'recommendation' => $this->generateImportRecommendation($analysis),
                'file_info' => [
                    'name' => $file->getClientOriginalName(),
                    'size' => $file->getSize(),
                    'records_total' => $analysis['users']['total'] +
                        $analysis['pay_sheets']['total'] +
                        $analysis['censuses']['total'],
                ]
            ]);
        } catch (Exception $e) {
            Log::error('Error en previsualización: ', [
                'message' => $e->getMessage(),
                'line' => $e->getLine(),
            ]);

            return response()->json([
                'status' => false,
                'message' => 'Error en previsualización: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(Repository $repository)
    {
        $repository->load('user');

        $details = [
            'created_at_formatted' => $repository->created_at->format('d/m/Y H:i:s'),
            'completed_at_formatted' => $repository->completed_at ? $repository->completed_at->format('d/m/Y H:i:s') : null,
            'duration' => $repository->completed_at ?
                $repository->created_at->diffForHumans($repository->completed_at, true) : null,
            'file_exists' => $repository->fileExists(),
            'file_size' => $repository->fileExists() ? filesize($repository->getFullPath()) : 0,
        ];

        return response()->json([
            'data' => $repository,
            'details' => $details,
            'download_url' => $repository->fileExists() ? route('repositories.download', $repository) : null,
        ]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Repository $repository)
    {
        try {
            // Eliminar el archivo físico si existe
            if ($repository->fileExists()) {
                unlink($repository->getFullPath());
            }

            $repository->delete();

            return response()->json([
                'message' => 'Registro de repositorio eliminado exitosamente',
                'repository_id' => $repository->id,
            ]);
        } catch (Exception $e) {
            Log::error('Error al eliminar repositorio: ', [
                'message' => $e->getMessage(),
                'repository_id' => $repository->id,
            ]);

            return response()->json([
                'status' => false,
                'message' => 'Error al eliminar repositorio: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Reintentar importación fallida
     */
    public function retryImport(Repository $repository)
    {
        try {
            if (!$repository->isImport()) {
                return response()->json([
                    'message' => 'Solo se pueden reintentar operaciones de importación'
                ], 400);
            }

            if ($repository->status !== 'failed') {
                return response()->json([
                    'message' => 'Solo se pueden reintentar operaciones fallidas'
                ], 400);
            }

            if (!$repository->fileExists()) {
                return response()->json([
                    'message' => 'El archivo de importación no existe'
                ], 404);
            }

            DB::beginTransaction();

            // Actualizar estado a procesando
            $repository->markAsProcessing();
            $repository->update(['error_message' => null]);

            // Obtener metadatos de la importación original
            $metadata = $repository->metadata;

            // Procesar importación
            $data = $repository->getFileContent();

            $result = $this->repositoryService->importFromJson($data, [
                'import_users' => $metadata['import_users'] ?? true,
                'import_pay_sheets' => $metadata['import_pay_sheets'] ?? true,
                'import_census' => $metadata['import_census'] ?? true,
                'force_import' => $metadata['force_import'] ?? false,
            ]);

            DB::commit();

            // Preparar resumen
            $summary = $this->prepareImportSummary($result);
            $summary['retry_of'] = $repository->id;
            $summary['retried_at'] = now()->toDateTimeString();

            $totalRecords = $summary['total_inserted'] + $summary['total_updated'] + $summary['total_skipped'];

            // Actualizar Repository
            $repository->update(['records_count' => $totalRecords]);
            $repository->markAsCompleted($summary);

            // Registrar actividad
            $this->logActivity($repository, 'import_retry');

            return response()->json([
                'message' => 'Reintento de importación completado exitosamente',
                'data' => $repository->fresh()->load('user'),
                'summary' => $summary,
                'success' => $summary['total_errors'] === 0,
            ]);
        } catch (Exception $e) {
            DB::rollBack();

            $repository->markAsFailed($e->getMessage());

            Log::error('Error al reintentar importación: ', [
                'message' => $e->getMessage(),
                'repository_id' => $repository->id,
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'status' => false,
                'message' => 'Error al reintentar importación: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtener estadísticas
     */
    public function statistics(Request $request)
    {
        $period = $request->get('period', 'month');

        $statistics = $this->repositoryService->getStatistics($period);

        $topUsers = Repository::with('user')
            ->selectRaw('user_id, count(*) as operations_count')
            ->groupBy('user_id')
            ->orderBy('operations_count', 'desc')
            ->limit(5)
            ->get()
            ->map(function ($item) {
                return [
                    'user_id' => $item->user_id,
                    'user_name' => $item->user->full_name ?? 'N/A',
                    'operations_count' => $item->operations_count,
                    'last_operation' => $item->created_at->format('d/m/Y H:i'),
                ];
            });

        $recentOperations = Repository::with('user')
            ->latest()
            ->limit(10)
            ->get()
            ->map(function ($repo) {
                return [
                    'id' => $repo->id,
                    'type' => $repo->operation_type,
                    'file_name' => $repo->file_name,
                    'status' => $repo->status,
                    'user_name' => $repo->user->full_name ?? 'N/A',
                    'created_at' => $repo->created_at->format('d/m/Y H:i'),
                    'records' => $repo->records_count,
                ];
            });

        return response()->json([
            'statistics' => $statistics,
            'top_users' => $topUsers,
            'recent_operations' => $recentOperations,
        ]);
    }

    /**
     * Descargar archivo
     */
    public function download(Repository $repository)
    {
        if (!$repository->fileExists()) {
            return response()->json([
                'message' => 'El archivo no existe o ha sido eliminado'
            ], 404);
        }

        return response()->download(
            $repository->getFullPath(),
            $repository->file_name,
            [
                'Content-Type' => 'application/json',
                'Content-Disposition' => 'attachment; filename="' . $repository->file_name . '"',
            ]
        );
    }

    /**
     * Obtener contenido del archivo
     */
    public function getFileContent(Repository $repository)
    {
        if (!$repository->fileExists()) {
            return response()->json([
                'message' => 'El archivo no existe o ha sido eliminado'
            ], 404);
        }

        try {
            $content = $repository->getFileContent();

            return response()->json([
                'data' => $content,
                'metadata' => [
                    'file_name' => $repository->file_name,
                    'file_size' => filesize($repository->getFullPath()),
                    'created_at' => $repository->created_at->toDateTimeString(),
                    'operation_type' => $repository->operation_type,
                ]
            ]);
        } catch (Exception $e) {
            return response()->json([
                'message' => 'Error al leer el archivo: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Helper: Preparar resumen de importación
     */
    private function prepareImportSummary($result): array
    {
        return [
            'total_inserted' => $result['users']['inserted'] + $result['pay_sheets']['inserted'] + $result['censuses']['inserted'],
            'total_updated' => $result['users']['updated'] + $result['pay_sheets']['updated'] + $result['censuses']['updated'],
            'total_skipped' => $result['users']['skipped'] + $result['pay_sheets']['skipped'] + $result['censuses']['skipped'],
            'total_errors' => count($result['users']['errors']) +
                count($result['pay_sheets']['errors']) +
                count($result['censuses']['errors']),
            'by_table' => [
                'users' => $result['users'],
                'pay_sheets' => $result['pay_sheets'],
                'censuses' => $result['censuses'],
            ]
        ];
    }

    /**
     * Helper: Generar recomendación de importación
     */
    private function generateImportRecommendation($analysis): string
    {
        $recommendations = [];
        $warnings = [];

        // Recomendaciones para usuarios
        if ($analysis['users']['existing_by_email'] > 0) {
            $warnings[] = "{$analysis['users']['existing_by_email']} usuarios ya existen por email";
        }

        // Recomendaciones para pay_sheets
        if ($analysis['pay_sheets']['existing_by_ci'] > 0) {
            $warnings[] = "{$analysis['pay_sheets']['existing_by_ci']} pay_sheets ya existen por CI";
        }

        // Advertencias para censuses
        if (!empty($analysis['censuses']['pay_sheets_missing'])) {
            $warnings[] = count($analysis['censuses']['pay_sheets_missing']) .
                " censuses hacen referencia a pay_sheets que no existen";
        }

        // Positivos
        if ($analysis['users']['new'] > 0) {
            $recommendations[] = "{$analysis['users']['new']} nuevos usuarios serán importados";
        }

        if ($analysis['pay_sheets']['new'] > 0) {
            $recommendations[] = "{$analysis['pay_sheets']['new']} nuevos pay_sheets serán importados";
        }

        if ($analysis['censuses']['total'] > 0) {
            $recommendations[] = "{$analysis['censuses']['total']} censuses serán procesados";
        }

        $response = "";

        if (!empty($recommendations)) {
            $response .= "Recomendaciones:\n" . implode("\n", $recommendations);
        }

        if (!empty($warnings)) {
            if ($response) $response .= "\n\n";
            $response .= "Advertencias:\n" . implode("\n", $warnings);
        }

        if (empty($response)) {
            $response = "No se detectaron cambios significativos para importar.";
        }

        return $response;
    }

    /**
     * Helper: Registrar actividad
     */
    private function logActivity(Repository $repository, string $action): void
    {
        $activityEnum = null;

        if ($action === 'export') {
            $activityEnum = ActivityEnum::REPOSITORY_EXPORT;
        } elseif ($action === 'import') {
            $activityEnum = ActivityEnum::REPOSITORY_IMPORT;
        }

        if ($activityEnum) {
            Activity::create([
                'user_id' => Auth::id(),
                'id_affected' => $repository->id,
                'activity' => $activityEnum,
            ]);
        }
    }
}
