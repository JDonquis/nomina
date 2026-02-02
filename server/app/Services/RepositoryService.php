<?php

namespace App\Services;

use Exception;
use Carbon\Carbon;
use App\Models\User;
use App\Models\Census;
use App\Models\Activity;
use App\Models\Repository;
use App\Models\PaySheet;
use App\Enums\ActivityEnum;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;

class RepositoryService
{
    /**
     * Exportar TODOS los datos a JSON
     */
    public function exportAllData($options = [])
    {
        $exportData = [
            'metadata' => [
                'export_date' => Carbon::now()->toDateTimeString(),
                'exported_by' => Auth::id(),
                'exported_by_name' => Auth::user()->full_name ?? 'Sistema',
                'database' => config('database.default'),
                'version' => '1.0',
            ],
            'data' => [
                'users' => [],
                'pay_sheets' => [],
                'censuses' => [],
            ]
        ];

        // Exportar usuarios
        if ($options['include_users'] ?? true) {
            $exportData['data']['users'] = User::all()->map(function ($user) {
                return $this->formatUserForExport($user);
            })->toArray();
        }

        // Exportar pay_sheets con relaciones
        if ($options['include_pay_sheets'] ?? true) {
            $exportData['data']['pay_sheets'] = PaySheet::with(['typePaySheet', 'administrativeLocation'])
                ->get()
                ->map(function ($paySheet) {
                    return $this->formatPaySheetForExport($paySheet);
                })->toArray();
        }

        // Exportar censuses
        if ($options['include_census'] ?? true) {
            $exportData['data']['censuses'] = Census::all()
                ->map(function ($census) {
                    return $this->formatCensusForExport($census);
                })->toArray();
        }

        return $exportData;
    }

    /**
     * Formatear usuario para exportación
     */
    private function formatUserForExport(User $user): array
    {
        return [
            'id' => $user->id,
            'full_name' => $user->full_name,
            'charge' => $user->charge,
            'email' => $user->email,
            'is_admin' => $user->is_admin,
            'email_verified_at' => $user->email_verified_at?->toDateTimeString(),
            'created_at' => $user->created_at->toDateTimeString(),
            'updated_at' => $user->updated_at->toDateTimeString(),
        ];
    }

    /**
     * Formatear pay_sheet para exportación
     */
    private function formatPaySheetForExport(PaySheet $paySheet): array
    {
        return [
            'id' => $paySheet->id,
            'nac' => $paySheet->nac,
            'ci' => $paySheet->ci,
            'full_name' => $paySheet->full_name,
            'date_birth' => $paySheet->date_birth,
            'sex' => $paySheet->sex,
            'city' => $paySheet->city,
            'state' => $paySheet->state,
            'administrative_location_id' => $paySheet->administrative_location_id,
            'phone_number' => $paySheet->phone_number,
            'photo' => $paySheet->photo,
            'type_pension' => $paySheet->type_pension,
            'type_pay_sheet_id' => $paySheet->type_pay_sheet_id,
            'last_charge' => $paySheet->last_charge,
            'civil_status' => $paySheet->civil_status,
            'minor_child_nro' => $paySheet->minor_child_nro,
            'disabled_child_nro' => $paySheet->disabled_child_nro,
            'receive_pension_from_another_organization_status' => $paySheet->receive_pension_from_another_organization_status,
            'another_organization_name' => $paySheet->another_organization_name,
            'has_authorizations' => $paySheet->has_authorizations,
            'pension_survivor_status' => $paySheet->pension_survivor_status,
            'fullname_causative' => $paySheet->fullname_causative,
            'age_causative' => $paySheet->age_causative,
            'parent_causative' => $paySheet->parent_causative,
            'sex_causative' => $paySheet->sex_causative,
            'ci_causative' => $paySheet->ci_causative,
            'decease_date' => $paySheet->decease_date,
            'suspend_payment_status' => $paySheet->suspend_payment_status,
            'last_payment' => $paySheet->last_payment,
            'created_at' => $paySheet->created_at->toDateTimeString(),
            'updated_at' => $paySheet->updated_at->toDateTimeString(),
            'type_pay_sheet' => $paySheet->typePaySheet ? [
                'id' => $paySheet->typePaySheet->id,
                'name' => $paySheet->typePaySheet->name,
                'code' => $paySheet->typePaySheet->code,
            ] : null,
            'administrative_location' => $paySheet->administrativeLocation ? [
                'id' => $paySheet->administrativeLocation->id,
                'name' => $paySheet->administrativeLocation->name,
            ] : null,
        ];
    }

    /**
     * Formatear census para exportación
     */
    private function formatCensusForExport(Census $census): array
    {
        return [
            'id' => $census->id,
            'pay_sheets_id' => $census->pay_sheets_id,
            'user_id' => $census->user_id,
            'status' => $census->status,
            'expiration_date' => $census->expiration_date,
            'created_at' => $census->created_at->toDateTimeString(),
            'updated_at' => $census->updated_at->toDateTimeString(),
        ];
    }

    /**
     * Importar datos desde JSON con validaciones
     */
    public function importFromJson($data, $options = [])
    {
        if (is_string($data)) {
            $decodedData = json_decode($data, true);
        } else {
            $decodedData = $data;
        }

        if (!isset($decodedData['data'])) {
            throw new Exception('Formato JSON inválido. Se esperaba clave "data".');
        }

        $results = [
            'users' => ['inserted' => 0, 'updated' => 0, 'skipped' => 0, 'errors' => []],
            'pay_sheets' => ['inserted' => 0, 'updated' => 0, 'skipped' => 0, 'errors' => []],
            'censuses' => ['inserted' => 0, 'updated' => 0, 'skipped' => 0, 'errors' => []],
        ];

        // Importar usuarios (por email)
        if ($options['import_users'] ?? true) {
            $userResult = $this->importUsers($decodedData['data']['users'] ?? [], $options);
            $results['users'] = $userResult;
        }

        // Importar pay_sheets (por ci)
        if ($options['import_pay_sheets'] ?? true) {
            $paySheetResult = $this->importPaySheets($decodedData['data']['pay_sheets'] ?? [], $options);
            $results['pay_sheets'] = $paySheetResult;
        }

        // Importar censuses (manejo especial por pay_sheet)
        if ($options['import_census'] ?? true) {
            $censusResult = $this->importCensuses($decodedData['data']['censuses'] ?? [], $options);
            $results['censuses'] = $censusResult;
        }

        return $results;
    }

    /**
     * Importar usuarios manteniendo IDs
     */
    private function importUsers($users, $options = []): array
    {
        $inserted = 0;
        $updated = 0;
        $skipped = 0;
        $errors = [];

        foreach ($users as $index => $user) {
            try {
                // Validar datos mínimos
                if (empty($user['email'])) {
                    $errors[] = "Usuario índice {$index}: Email es requerido";
                    continue;
                }

                // Verificar por email primero
                $existingByEmail = User::where('email', $user['email'])->first();

                if ($existingByEmail) {
                    if ($options['force_import'] ?? false) {
                        // Forzar actualización
                        $existingByEmail->update($this->prepareUserData($user));
                        $updated++;
                    } else {
                        // Ya existe por email, saltar
                        $skipped++;
                    }
                    continue;
                }

                // Verificar si el ID ya existe
                if (isset($user['id'])) {
                    $existingById = User::find($user['id']);

                    if ($existingById) {
                        if ($options['force_import'] ?? false) {
                            // Actualizar existente
                            $existingById->update($this->prepareUserData($user));
                            $updated++;
                        } else {
                            // ID ya existe, saltar
                            $skipped++;
                        }
                    } else {
                        // Insertar manteniendo el ID
                        User::create($this->prepareUserData($user, true));
                        $inserted++;
                    }
                } else {
                    // Insertar sin ID específico
                    User::create($this->prepareUserData($user));
                    $inserted++;
                }
            } catch (\Exception $e) {
                $errors[] = "Usuario índice {$index}: " . $e->getMessage();
            }
        }

        return ['inserted' => $inserted, 'updated' => $updated, 'skipped' => $skipped, 'errors' => $errors];
    }

    /**
     * Preparar datos de usuario para importación
     */
    private function prepareUserData($userData, $keepId = false): array
    {
        $data = [
            'full_name' => $userData['full_name'] ?? '',
            'charge' => $userData['charge'] ?? '',
            'email' => $userData['email'],
            'is_admin' => $userData['is_admin'] ?? false,
            'email_verified_at' => isset($userData['email_verified_at'])
                ? Carbon::parse($userData['email_verified_at'])
                : null,
        ];

        // Solo incluir ID si se especifica mantenerlo
        if ($keepId && isset($userData['id'])) {
            $data['id'] = $userData['id'];
        }

        // Si no hay contraseña, crear una temporal
        if (!isset($userData['password'])) {
            $data['password'] = bcrypt('temp_password_' . time() . '_' . rand(1000, 9999));
        } else {
            $data['password'] = $userData['password'];
        }

        return $data;
    }

    /**
     * Importar pay_sheets usando CI como campo único
     */
    private function importPaySheets($paySheets, $options = []): array
    {
        $inserted = 0;
        $updated = 0;
        $skipped = 0;
        $errors = [];

        foreach ($paySheets as $index => $paySheet) {
            try {
                // Validar que tenga CI
                if (empty($paySheet['ci'])) {
                    $errors[] = "PaySheet índice {$index}: CI es requerido";
                    continue;
                }

                // Buscar por CI (campo único)
                $existingByCi = PaySheet::where('ci', $paySheet['ci'])->first();

                if ($existingByCi) {
                    if ($options['force_import'] ?? false) {
                        // Forzar actualización
                        $existingByCi->update($this->preparePaySheetData($paySheet));
                        $updated++;
                    } else {
                        // Ya existe por CI, saltar
                        $skipped++;
                    }
                    continue;
                }

                // Si tiene ID, verificar si existe
                if (isset($paySheet['id'])) {
                    $existingById = PaySheet::find($paySheet['id']);

                    if ($existingById) {
                        // ID ya existe, verificar si es el mismo por CI
                        if ($existingById->ci !== $paySheet['ci']) {
                            // Tiene diferente CI, no podemos actualizar (conflicto)
                            $errors[] = "PaySheet ID {$paySheet['id']}: Conflicto de CI. Ya existe con CI {$existingById->ci}";
                            continue;
                        }

                        if ($options['force_import'] ?? false) {
                            // Actualizar existente
                            $existingById->update($this->preparePaySheetData($paySheet));
                            $updated++;
                        } else {
                            $skipped++;
                        }
                    } else {
                        // Insertar manteniendo ID
                        PaySheet::create($this->preparePaySheetData($paySheet, true));
                        $inserted++;
                    }
                } else {
                    // Insertar sin ID específico
                    PaySheet::create($this->preparePaySheetData($paySheet));
                    $inserted++;
                }
            } catch (\Exception $e) {
                $errors[] = "PaySheet índice {$index}: " . $e->getMessage();
            }
        }

        return ['inserted' => $inserted, 'updated' => $updated, 'skipped' => $skipped, 'errors' => $errors];
    }

    /**
     * Preparar datos de pay_sheet para importación
     */
    private function preparePaySheetData($paySheetData, $keepId = false): array
    {
        $data = [
            'nac' => $paySheetData['nac'] ?? 'V',
            'ci' => $paySheetData['ci'],
            'full_name' => $paySheetData['full_name'] ?? '',
            'date_birth' => $paySheetData['date_birth'] ?? null,
            'sex' => $paySheetData['sex'] ?? 'Sin asignar',
            'city' => $paySheetData['city'] ?? 'Sin asignar',
            'state' => $paySheetData['state'] ?? 'Falcon',
            'administrative_location_id' => $paySheetData['administrative_location_id'] ?? null,
            'phone_number' => $paySheetData['phone_number'] ?? null,
            'photo' => $paySheetData['photo'] ?? null,
            'type_pension' => $paySheetData['type_pension'] ?? 'Jubilacion',
            'type_pay_sheet_id' => $paySheetData['type_pay_sheet_id'] ?? 1,
            'last_charge' => $paySheetData['last_charge'] ?? null,
            'civil_status' => $paySheetData['civil_status'] ?? 'S',
            'minor_child_nro' => $paySheetData['minor_child_nro'] ?? 0,
            'disabled_child_nro' => $paySheetData['disabled_child_nro'] ?? 0,
            'receive_pension_from_another_organization_status' => $paySheetData['receive_pension_from_another_organization_status'] ?? false,
            'another_organization_name' => $paySheetData['another_organization_name'] ?? null,
            'has_authorizations' => $paySheetData['has_authorizations'] ?? false,
            'pension_survivor_status' => $paySheetData['pension_survivor_status'] ?? false,
            'fullname_causative' => $paySheetData['fullname_causative'] ?? null,
            'age_causative' => $paySheetData['age_causative'] ?? null,
            'parent_causative' => $paySheetData['parent_causative'] ?? null,
            'sex_causative' => $paySheetData['sex_causative'] ?? null,
            'ci_causative' => $paySheetData['ci_causative'] ?? null,
            'decease_date' => $paySheetData['decease_date'] ?? null,
            'suspend_payment_status' => $paySheetData['suspend_payment_status'] ?? false,
            'last_payment' => $paySheetData['last_payment'] ?? null,
        ];

        // Solo incluir ID si se especifica mantenerlo
        if ($keepId && isset($paySheetData['id'])) {
            $data['id'] = $paySheetData['id'];
        }

        return $data;
    }

    /**
     * Importar censuses con manejo especial de status
     */
    private function importCensuses($censuses, $options = []): array
    {
        $inserted = 0;
        $updated = 0;
        $skipped = 0;
        $errors = [];

        // Agrupar censuses por pay_sheets_id para manejar status
        $groupedCensuses = [];
        foreach ($censuses as $census) {
            if (!empty($census['pay_sheets_id'])) {
                $groupedCensuses[$census['pay_sheets_id']][] = $census;
            }
        }

        // Procesar por grupo de pay_sheet
        foreach ($groupedCensuses as $paySheetId => $censusGroup) {
            try {
                // Verificar que el pay_sheet exista
                $paySheetExists = PaySheet::where('id', $paySheetId)->exists();
                if (!$paySheetExists) {
                    $errors[] = "Censuses para PaySheet ID {$paySheetId}: PaySheet no encontrado";
                    continue;
                }

                // Ordenar por fecha de expiración (más reciente primero)
                usort($censusGroup, function ($a, $b) {
                    $dateA = isset($a['expiration_date']) ? Carbon::parse($a['expiration_date']) : Carbon::minValue();
                    $dateB = isset($b['expiration_date']) ? Carbon::parse($b['expiration_date']) : Carbon::minValue();
                    return $dateB <=> $dateA; // Descendente
                });

                // Verificar censuses existentes para este pay_sheet
                $existingCensuses = Census::where('pay_sheets_id', $paySheetId)->get();

                // Si ya existen censuses y no estamos forzando importación, poner todos en false primero
                if ($existingCensuses->isNotEmpty() && !($options['force_import'] ?? false)) {
                    Census::where('pay_sheets_id', $paySheetId)
                        ->update(['status' => false]);
                }

                $processedIds = [];

                // Procesar cada census del grupo
                foreach ($censusGroup as $censusIndex => $census) {
                    try {
                        // Determinar status: solo el más reciente será true
                        $isMostRecent = $censusIndex === 0;

                        $censusData = [
                            'pay_sheets_id' => $paySheetId,
                            'user_id' => $census['user_id'] ?? Auth::id(),
                            'status' => $isMostRecent,
                            'expiration_date' => $census['expiration_date'] ?? Carbon::now()->endOfYear()->format('Y-m-d'),
                        ];

                        // Si tiene ID, verificar
                        if (isset($census['id'])) {
                            $existingCensus = Census::find($census['id']);

                            if ($existingCensus) {
                                if ($options['force_import'] ?? false) {
                                    // Actualizar existente
                                    if ($existingCensus->pay_sheets_id != $paySheetId) {
                                        $errors[] = "Census ID {$census['id']}: No se puede cambiar el pay_sheet_id de {$existingCensus->pay_sheets_id} a {$paySheetId}";
                                        continue;
                                    }

                                    $existingCensus->update($censusData);
                                    $updated++;
                                } else {
                                    $skipped++;
                                }
                            } else {
                                // Insertar con ID específico
                                $censusData['id'] = $census['id'];
                                Census::create($censusData);
                                $inserted++;
                            }
                        } else {
                            // Insertar nuevo
                            Census::create($censusData);
                            $inserted++;
                        }

                        $processedIds[] = $census['id'] ?? null;
                    } catch (\Exception $e) {
                        $errors[] = "Census para PaySheet {$paySheetId} (índice {$censusIndex}): " . $e->getMessage();
                    }
                }
            } catch (\Exception $e) {
                $errors[] = "Grupo PaySheet {$paySheetId}: " . $e->getMessage();
            }
        }

        return ['inserted' => $inserted, 'updated' => $updated, 'skipped' => $skipped, 'errors' => $errors];
    }

    /**
     * Analizar datos de importación sin importar
     */
    public function analyzeImportData($data, $options = [])
    {
        if (is_string($data)) {
            $decodedData = json_decode($data, true);
        } else {
            $decodedData = $data;
        }

        $analysis = [
            'users' => [
                'total' => count($decodedData['data']['users'] ?? []),
                'existing_by_email' => 0,
                'existing_by_id' => 0,
                'new' => 0,
                'emails' => [],
            ],
            'pay_sheets' => [
                'total' => count($decodedData['data']['pay_sheets'] ?? []),
                'existing_by_ci' => 0,
                'existing_by_id' => 0,
                'new' => 0,
                'cis' => [],
            ],
            'censuses' => [
                'total' => count($decodedData['data']['censuses'] ?? []),
                'grouped_by_pay_sheet' => [],
                'pay_sheets_missing' => [],
            ]
        ];

        // Analizar usuarios si se incluyen
        if ($options['import_users'] ?? true) {
            foreach ($decodedData['data']['users'] ?? [] as $user) {
                $email = $user['email'] ?? null;
                if ($email) {
                    $analysis['users']['emails'][] = $email;

                    $existingByEmail = User::where('email', $email)->exists();
                    $existingById = isset($user['id']) ? User::find($user['id']) : null;

                    if ($existingByEmail) {
                        $analysis['users']['existing_by_email']++;
                    } elseif ($existingById) {
                        $analysis['users']['existing_by_id']++;
                    } else {
                        $analysis['users']['new']++;
                    }
                }
            }
        }

        // Analizar pay_sheets si se incluyen
        if ($options['import_pay_sheets'] ?? true) {
            foreach ($decodedData['data']['pay_sheets'] ?? [] as $paySheet) {
                $ci = $paySheet['ci'] ?? null;
                if ($ci) {
                    $analysis['pay_sheets']['cis'][] = $ci;

                    $existingByCi = PaySheet::where('ci', $ci)->exists();
                    $existingById = isset($paySheet['id']) ? PaySheet::find($paySheet['id']) : null;

                    if ($existingByCi) {
                        $analysis['pay_sheets']['existing_by_ci']++;
                    } elseif ($existingById) {
                        $analysis['pay_sheets']['existing_by_id']++;
                    } else {
                        $analysis['pay_sheets']['new']++;
                    }
                }
            }
        }

        // Analizar censuses si se incluyen
        if ($options['import_census'] ?? true) {
            foreach ($decodedData['data']['censuses'] ?? [] as $census) {
                $paySheetId = $census['pay_sheets_id'] ?? null;
                if ($paySheetId) {
                    if (!isset($analysis['censuses']['grouped_by_pay_sheet'][$paySheetId])) {
                        $analysis['censuses']['grouped_by_pay_sheet'][$paySheetId] = 0;
                    }
                    $analysis['censuses']['grouped_by_pay_sheet'][$paySheetId]++;

                    // Verificar si el pay_sheet existe
                    if (!PaySheet::where('id', $paySheetId)->exists()) {
                        $analysis['censuses']['pay_sheets_missing'][] = $paySheetId;
                    }
                }
            }

            // Eliminar duplicados
            $analysis['censuses']['pay_sheets_missing'] = array_unique($analysis['censuses']['pay_sheets_missing']);
        }

        return $analysis;
    }

    /**
     * Guardar archivo de exportación
     */
    public function saveExportFile($data, $fileName, $directory = 'exports'): string
    {
        $filePath = $directory . '/' . date('Y/m/d') . '/' . $fileName;
        $fullPath = storage_path('app/public/' . $filePath);

        // Asegurar que el directorio existe
        if (!file_exists(dirname($fullPath))) {
            mkdir(dirname($fullPath), 0755, true);
        }

        file_put_contents($fullPath, json_encode($data, JSON_PRETTY_PRINT));

        return $filePath;
    }

    /**
     * Guardar archivo de importación
     */
    public function saveImportFile($file, $fileName, $directory = 'imports'): string
    {
        $filePath = $directory . '/' . date('Y/m/d') . '/' . $fileName;

        // Guardar archivo
        $file->storeAs('public', $filePath);

        return $filePath;
    }

    /**
     * Crear registro de repositorio
     */
    public function createRepositoryRecord(array $data): Repository
    {
        return Repository::create($data);
    }

    /**
     * Obtener estadísticas de repositorios
     */
    public function getStatistics($period = 'month')
    {
        $query = Repository::query();

        // Filtrar por período
        if ($period === 'day') {
            $query->whereDate('created_at', now()->toDateString());
        } elseif ($period === 'week') {
            $query->whereBetween('created_at', [now()->startOfWeek(), now()->endOfWeek()]);
        } elseif ($period === 'month') {
            $query->whereMonth('created_at', now()->month)
                ->whereYear('created_at', now()->year);
        } elseif ($period === 'year') {
            $query->whereYear('created_at', now()->year);
        }

        $total = $query->count();
        $exports = $query->where('operation_type', 'export')->count();
        $imports = $query->where('operation_type', 'import')->count();
        $completed = $query->where('status', 'completed')->count();
        $failed = $query->where('status', 'failed')->count();
        $processing = $query->where('status', 'processing')->count();

        // Operaciones por día (últimos 7 días)
        $dailyOperations = Repository::whereDate('created_at', '>=', now()->subDays(7))
            ->selectRaw('DATE(created_at) as date, operation_type, count(*) as count')
            ->groupBy('date', 'operation_type')
            ->orderBy('date', 'desc')
            ->get()
            ->groupBy('date');

        return [
            'period' => $period,
            'total_operations' => $total,
            'exports' => $exports,
            'imports' => $imports,
            'completed' => $completed,
            'failed' => $failed,
            'processing' => $processing,
            'success_rate' => $total > 0 ? round(($completed / $total) * 100, 2) : 0,
            'daily_operations' => $dailyOperations,
        ];
    }
}
