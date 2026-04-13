<?php

namespace App\Services;

use App\Models\ASIC;
use App\Models\Department;
use App\Models\Service;
use App\Models\TypePaySheet;
use App\Models\AdministrativeLocation;
use App\Models\Dependency;
use App\Models\AdministrativeUnit;
use App\Models\TypePersonnel;
use App\Models\Personnel;
use App\Models\ActivePersonnel;
use App\Models\Census;
use App\Models\FamilyMember;
use App\Models\PaySheet;
use App\Models\User;
use App\Models\Activity;
use App\Models\SyncLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class SyncService
{
    private array $tables = [
        'asics',
        'dependencies',
        'administrative_units',
        'departments',
        'services',
        'type_personnels',
        'type_pay_sheets',
        'administrative_locations',
        'personnels',
        'active_personnels',
        'family_members',
        'censuses',
        'pay_sheets',
        'users',
        'activities',
    ];

    private array $models = [
        'asics' => ASIC::class,
        'dependencies' => Dependency::class,
        'administrative_units' => AdministrativeUnit::class,
        'departments' => Department::class,
        'services' => Service::class,
        'type_personnels' => TypePersonnel::class,
        'type_pay_sheets' => TypePaySheet::class,
        'administrative_locations' => AdministrativeLocation::class,
        'personnels' => Personnel::class,
        'active_personnels' => ActivePersonnel::class,
        'family_members' => FamilyMember::class,
        'censuses' => Census::class,
        'pay_sheets' => PaySheet::class,
        'users' => User::class,
        'activities' => Activity::class,
    ];

    public function export(): array
    {
        $data = [];
        $totalRecords = 0;

        foreach ($this->tables as $table) {
            $model = $this->models[$table];
            $records = $model::all()->map(function ($item) {
                return $this->formatRecordForExport($item);
            });

            $data[$table] = [
                'data' => $records,
                'hash' => md5($records->toJson()),
                'count' => $records->count(),
            ];

            $totalRecords += $records->count();
        }

        $exportData = [
            'meta' => [
                'version' => '1.0',
                'exported_at' => now()->toIso8601String(),
                'user_id' => Auth::id(),
                'system_version' => config('app.version', '1.0.0'),
            ],
            'tables' => $data,
            'total_records' => $totalRecords,
        ];

        SyncLog::create([
            'sync_id' => Str::uuid(),
            'user_id' => Auth::id(),
            'direction' => 'export',
            'status' => 'completed',
            'records_exported' => $totalRecords,
            'synced_at' => now(),
        ]);

        return $exportData;
    }

    public function exportToFile()
    {
        $data = $this->export();
        $json = json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);

        $filename = 'sync_export_' . now()->format('Y-m-d_His') . '.json';

        return response()->streamDownload(function () use ($json) {
            echo $json;
        }, $filename, [
            'Content-Type' => 'application/json',
            'Content-Disposition' => 'attachment; filename="' . $filename . '"',
        ]);
    }

    public function import(Request $request): array
    {
        $request->validate([
            'file' => 'required|file|mimes:json,txt',
        ]);

        $file = $request->file('file');
        $content = file_get_contents($file->getRealPath());
        $data = json_decode($content, true);

        if (json_last_error() !== JSON_ERROR_NONE) {
            throw new \Exception('Archivo JSON inválido');
        }

        $result = [
            'new' => [],
            'updated' => [],
            'conflicts' => [],
            'errors' => [],
        ];

        DB::beginTransaction();

        try {
            foreach ($data['tables'] ?? [] as $tableName => $tableData) {
                if (!isset($this->models[$tableName])) {
                    continue;
                }

                $modelClass = $this->models[$tableName];

                foreach ($tableData['data'] ?? [] as $record) {
                    $syncId = $record['sync_id'] ?? null;
                    $updatedAt = $record['updated_at'] ?? null;

                    if (!$syncId) {
                        $result['errors'][] = "Registro sin sync_id en tabla {$tableName}";
                        continue;
                    }

                    $existingRecord = $modelClass::where('sync_id', $syncId)->first();

                    if (!$existingRecord) {
                        $newRecord = $this->createRecord($modelClass, $record);
                        $result['new'][] = [
                            'table' => $tableName,
                            'sync_id' => $syncId,
                            'id' => $newRecord->id,
                        ];
                    } else {
                        $hostingUpdatedAt = $existingRecord->updated_at;
                        $localUpdatedAt = \Carbon\Carbon::parse($updatedAt);

                        if ($hostingUpdatedAt->gt($localUpdatedAt)) {
                            $result['conflicts'][] = [
                                'table' => $tableName,
                                'sync_id' => $syncId,
                                'local' => $record,
                                'hosting' => $existingRecord->toArray(),
                            ];
                        } else {
                            $this->updateRecord($existingRecord, $record);
                            $result['updated'][] = [
                                'table' => $tableName,
                                'sync_id' => $syncId,
                                'id' => $existingRecord->id,
                            ];
                        }
                    }
                }
            }

            SyncLog::create([
                'sync_id' => Str::uuid(),
                'user_id' => Auth::id(),
                'direction' => 'import',
                'status' => 'completed',
                'records_imported' => count($result['new']) + count($result['updated']),
                'conflicts_count' => count($result['conflicts']),
                'summary' => $result,
                'synced_at' => now(),
            ]);

            DB::commit();

            return $result;
        } catch (\Exception $e) {
            DB::rollBack();

            Log::error('Error en sincronización import', [
                'message' => $e->getMessage(),
                'line' => $e->getLine(),
            ]);

            throw $e;
        }
    }

    public function resolveConflicts(array $resolutions): array
    {
        $results = [
            'resolved' => 0,
            'errors' => [],
        ];

        DB::beginTransaction();

        try {
            foreach ($resolutions as $resolution) {
                $table = $resolution['table'];
                $syncId = $resolution['sync_id'];
                $action = $resolution['action'];

                if (!isset($this->models[$table])) {
                    $results['errors'][] = "Tabla no encontrada: {$table}";
                    continue;
                }

                $modelClass = $this->models[$table];
                $record = $modelClass::where('sync_id', $syncId)->first();

                if (!$record) {
                    $results['errors'][] = "Registro no encontrado: {$table}/{$syncId}";
                    continue;
                }

                if ($action === 'use_local' && isset($resolution['data'])) {
                    $this->updateRecord($record, $resolution['data']);
                }

                $results['resolved']++;
            }

            DB::commit();

            return $results;
        } catch (\Exception $e) {
            DB::rollBack();

            Log::error('Error al resolver conflictos', [
                'message' => $e->getMessage(),
            ]);

            throw $e;
        }
    }

    public function getLastSync(): ?SyncLog
    {
        return SyncLog::orderBy('created_at', 'desc')->first();
    }

    public function getSyncHistory(int $limit = 10): \Illuminate\Database\Eloquent\Collection
    {
        return SyncLog::with('user')
            ->orderBy('created_at', 'desc')
            ->limit($limit)
            ->get();
    }

    private function formatRecordForExport($item): array
    {
        $data = $item->toArray();

        unset($data['id']);

        if (isset($data['password'])) {
            unset($data['password']);
        }

        if (isset($data['remember_token'])) {
            unset($data['remember_token']);
        }

        return $data;
    }

    private function createRecord(string $modelClass, array $data): Model
    {
        $fillable = (new $modelClass())->getFillable();
        $filteredData = array_intersect_key($data, array_flip($fillable));

        return $modelClass::create($filteredData);
    }

    private function updateRecord($record, array $data): void
    {
        $fillable = $record->getFillable();
        $filteredData = array_intersect_key($data, array_flip($fillable));

        $record->update($filteredData);
    }
}
