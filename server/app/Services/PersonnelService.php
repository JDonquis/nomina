<?php

namespace App\Services;

use App\Models\AdministrativeUnit;
use App\Models\ASIC;
use App\Models\AuditLog;
use App\Models\Department;
use App\Models\Dependency;
use App\Models\JobPosition;
use App\Models\Personnel;
use App\Models\Service;
use App\Models\TypePersonnel;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Maatwebsite\Excel\Concerns\ToCollection;
use Maatwebsite\Excel\Concerns\WithHeadingRow;
use Maatwebsite\Excel\Facades\Excel;
use PhpOffice\PhpSpreadsheet\Shared\Date;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;

class PersonnelService
{
    private $fieldsWithoutCensus = [
        'photo',
        'nac',
        'ci',
        'full_name',
        'date_birth',
        'sex',
        'asic_id',
        'city',
        'state',
        'phone_number',
        'email',
        'municipality',
        'parish',
        'address',
        'civil_status',
        'receive_pension_from_another_organization_status',
        'has_authorizations',
        'pension_survivor_status',
        'suspend_payment_status',
        'type_personnel_id',
        'status',
        'additional_data' => [
            'type_pension',
            'type_pay_sheet',
            'last_charge',
            'minor_child_nro',
            'disabled_child_nro',
            'another_organization_name',
            'fullname_causative',
            'age_causative',
            'parent_causative',
            'sex_causative',
            'ci_causative',
            'decease_date',
            'last_payment',
            'degree_obtained',
            'pregraduate_degree',
            'postgraduate_degree',
            'mobile_phone',
            'fixed_phone',
            'shirt_size',
            'pant_size',
            'shoe_size',
            'job_title',
            'entry_date',
            'labor_relationship',
            'payroll_dependency',
            'payroll_budget',
            'job_code',
            'bank_account_number',
        ],
    ];

    public function get($params = [], $type = 'inactive')
    {
        DB::enableQueryLog();

        $query = Personnel::query()->with(['typePersonnel', 'asic', 'dependency', 'administrativeUnit', 'department', 'service']);

        $query->where('status', $type === 'active' ? 'active' : 'inactive');

        if (!empty($params['search'])) {
            $search = $params['search'];

            $keywords = array_filter(explode(' ', $search));

            $query->where(function ($q) use ($keywords, $search) {

                $q->where(function ($subQ) use ($keywords) {
                    foreach ($keywords as $word) {
                        $subQ->where('full_name', 'LIKE', "%{$word}%");
                    }
                });

                $q->orWhere('ci', 'LIKE', "%{$search}%");

                foreach ($this->fieldsWithoutCensus['additional_data'] as $jsonField) {
                    $q->orWhere("additional_data->{$jsonField}", 'LIKE', "%{$search}%");
                }
            });
        }

        $filters = [];
        if (!empty($params['filters'])) {
            $filters = is_string($params['filters']) ? json_decode($params['filters'], true) : $params['filters'];

            if (isset($filters['status'])) {
                $query->where('status', $filters['status']);
            }

            if (isset($filters['census_status'])) {
                $censusStatus = $filters['census_status'] === 'Censado' || $filters['census_status'] === true ? 1 : 0;
                $query->where('census_status', $censusStatus);
            }

            if (isset($filters['type_personnel_id'])) {
                $query->where('type_personnel_id', $filters['type_personnel_id']);
            }

            if (isset($filters['full_name'])) {
                $query->where('full_name', 'LIKE', "%{$filters['full_name']}%");
            }

            if (isset($filters['ci'])) {
                $query->where('ci', 'LIKE', "%{$filters['ci']}%");
            }

            if (isset($filters['city'])) {
                $query->where('city', $filters['city']);
            }

            if (isset($filters['sex'])) {
                $query->where('sex', $filters['sex']);
            }

            if (isset($filters['asic.name'])) {
                $query->whereHas('asic', function ($q) use ($filters) {
                    $q->where('name', $filters['asic.name']);
                });
            }

            if (isset($filters['department.name'])) {
                $query->whereHas('department', function ($q) use ($filters) {
                    $q->where('name', $filters['department.name']);
                });
            }

            if (isset($filters['type_personnel.name'])) {
                $query->whereHas('typePersonnel', function ($q) use ($filters) {
                    $q->where('name', $filters['type_personnel.name']);
                });
            }

            if (isset($filters['work_status'])) {
                $query->where('work_status', $filters['work_status']);
            }

            if (isset($filters['dependency_id'])) {
                $query->where('dependency_id', $filters['dependency_id']);
            }
        }

        $sortField = $params['sortField'] ?? 'id';
        $sortDirection = $params['sortOrder'] ?? 'desc';
        $query->orderBy($sortField, $sortDirection);

        $perPage = $filters['per_page'] ?? 15;
        $perPage = max(1, min(100, $perPage));

        $results = $query->paginate($perPage);

        Log::info('Eje este es el valor: ', DB::getQueryLog());

        return $results;
    }

    public function show(Personnel $personnel)
    {
        $personnel->load(['typePersonnel', 'asic', 'dependency', 'administrativeUnit', 'department', 'service', 'auditLogs.user']);

        return $personnel;
    }

    private function getAllowedFields($toCensus)
    {
        $allowedFields = [];

        foreach ($this->fieldsWithoutCensus as $key => $value) {
            if (is_array($value)) {
                $allowedFields['additional_data'] = array_keys($value);
            } else {
                $allowedFields[] = $value;
            }
        }

        return $toCensus ? null : $allowedFields;
    }

    private function filterData($data, $allowedFields)
    {
        if ($allowedFields === null) {
            return $data;
        }

        $filtered = [];

        foreach ($data as $key => $value) {
            if (in_array($key, $allowedFields)) {
                $filtered[$key] = $value;
            }
        }

        if (isset($data['additional_data']) && isset($allowedFields['additional_data'])) {
            $filtered['additional_data'] = [];
            foreach ($data['additional_data'] as $key => $value) {
                if (in_array($key, $allowedFields['additional_data'])) {
                    $filtered['additional_data'][$key] = $value;
                }
            }
            if (empty($filtered['additional_data'])) {
                unset($filtered['additional_data']);
            }
        }

        return $filtered;
    }

    public function store($data, $photo = null)
    {
        $action = 'create';

        Log::info('Datos recibidos para crear personal', ['data' => $data]);

        $censusStatus = $data['to_census'] ?? false;
        unset($data['to_census']);

        $data['census_date'] = $censusStatus ? Carbon::now() : null;

        $allowedFields = $this->getAllowedFields($censusStatus);
        $data = $this->filterData($data, $allowedFields);

        $personnel = Personnel::create($data);

        if ($photo) {
            $this->updatePhoto($photo, $personnel);
        }

        if ($censusStatus) {
            $action = 'create_and_census';
            $personnel->update(['census_status' => true]);
        }

        // Carga las relaciones para que se incluyan en el log
        $personnel->load(['typePersonnel', 'asic', 'dependency', 'administrativeUnit', 'department', 'service']);

        AuditLog::create([
            'action' => $action,
            'auditable_type' => Personnel::class,
            'auditable_id' => $personnel->id,
            'user_id' => Auth::id(),
            'old_values' => null,
            'new_values' => $personnel->toArray(),
        ]);

        return $personnel;
    }

    public function update($data, Personnel $personnel, $photo = null)
    {
        $action = 'update';
        $censusStatus = $data['to_census'] ?? false;

        $data['census_date'] = $censusStatus ? Carbon::now() : null;

        // Carga y guarda relaciones del estado previo
        $personnel->load(['typePersonnel', 'asic', 'dependency', 'administrativeUnit', 'department', 'service']);
        $oldValues = $personnel->toArray();

        $allowedFields = $this->getAllowedFields($censusStatus);
        $data = $this->filterData($data, $allowedFields);

        if (!empty($data)) {
            $personnel->update($data);
        }

        if ($photo) {
            $this->updatePhoto($photo, $personnel);
        }

        if ($censusStatus) {
            $action = 'update_and_census';
            $personnel->update(['census_status' => true]);
        }

        $personnel->refresh();
        // Carga relaciones actualizadas tras el update
        $personnel->load(['typePersonnel', 'asic', 'dependency', 'administrativeUnit', 'department', 'service']);

        AuditLog::create([
            'action' => $action,
            'auditable_type' => Personnel::class,
            'auditable_id' => $personnel->id,
            'user_id' => Auth::id(),
            'old_values' => $oldValues,
            'new_values' => $personnel->toArray(),
        ]);

        return $personnel;
    }

    public function destroy(Personnel $personnel)
    {
        // Carga relaciones previas a la eliminación
        $personnel->load(['typePersonnel', 'asic', 'dependency', 'administrativeUnit', 'department', 'service']);
        $oldValues = $personnel->toArray();

        AuditLog::create([
            'action' => 'delete',
            'auditable_type' => Personnel::class,
            'auditable_id' => $personnel->id,
            'user_id' => Auth::id(),
            'old_values' => $oldValues,
            'new_values' => null,
        ]);

        if ($personnel->photo && Storage::disk('public')->exists($personnel->photo)) {
            Storage::disk('public')->delete($personnel->photo);
        }

        $personnel->delete();

        return true;
    }

    public function updatePhoto($photo, Personnel $personnel)
    {
        if ($personnel->photo && Storage::disk('public')->exists($personnel->photo)) {
            Storage::disk('public')->delete($personnel->photo);
        }

        $path = $photo->store('photos', 'public');
        $personnel->update(['photo' => $path]);

        return $personnel;
    }

    private function getHeaders(): array
    {
        return [
            'NAC (V/E)',
            'CEDULA',
            'NOMBRE COMPLETO',
            'FECHA NACIMIENTO (YYYY-MM-DD)',
            'SEXO (M/F)',
            'ESTADO CIVIL (S/C/V/D)',
            'GRADO OBTENIDO',
            'TITULO PRE GRADO',
            'TITULO POST GRADO',
            'DIRECCION',
            'EMAIL',
            'TELEFONO MOVIL',
            'TELEFONO FIJO',
            'TALLA CAMISA',
            'TALLA PANTALON',
            'TALLA ZAPATOS',
            'NOMBRE ASIC',
            'NOMBRE DEPENDENCIA',
            'NOMBRE UNIDAD ADM',
            'NOMBRE DEPARTAMENTO',
            'NOMBRE SERVICIO',
            'FECHA INGRESO (YYYY-MM-DD)',
            'CARGO',
            'RELACION LABORAL',
            'CODIGO NOMINA',
            'NOMBRE NOMINA',
            'PRESUPUESTO',
            'DEPENDENCIA NOMINA',
            'CODIGO CARGO',
            'NUMERO DE CUENTA',
        ];
    }

    public function exportTemplate($status = 'active')
    {
        $spreadsheet = new Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();

        $headers = $this->getHeaders();
        $sheet->fromArray($headers, null, 'A1');

        $lastCol = $sheet->getHighestColumn();
        for ($i = 'A'; $i <= $lastCol; $i++) {
            $sheet->getColumnDimension($i)->setAutoSize(true);
        }

        $writer = new Xlsx($spreadsheet);
        $filename = $status === 'active' ? 'plantilla_personal_activo.xlsx' : 'plantilla_fe_de_vida.xlsx';

        return response()->stream(function () use ($writer) {
            $writer->save('php://output');
        }, 200, [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition' => 'attachment; filename="' . $filename . '"',
        ]);
    }

    public function exportData($status = 'active')
    {
        $personnels = Personnel::where('status', $status)
            ->with(['typePersonnel', 'asic', 'dependency', 'administrativeUnit', 'department', 'service'])
            ->orderBy('id', 'asc')
            ->get();

        $spreadsheet = new Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();

        $headers = $this->getHeaders();
        $sheet->fromArray($headers, null, 'A1');

        $headerStyle = [
            'font' => ['bold' => true, 'color' => ['rgb' => 'FFFFFF']],
            'fill' => ['fillType' => 'solid', 'startColor' => ['rgb' => '2E7D32']],
            'alignment' => ['horizontal' => 'center'],
        ];
        $sheet->getStyle('A1:' . $sheet->getHighestColumn() . '1')->applyFromArray($headerStyle);

        $rowNum = 2;
        foreach ($personnels as $p) {
            $ad = $p->additional_data ?? [];

            $sexMap = ['M' => 'Masculino', 'F' => 'Femenino'];
            $civilMap = ['S' => 'Soltero', 'C' => 'Casado', 'V' => 'Viudo', 'D' => 'Divorciado'];

            $sheet->fromArray([
                $p->nac,
                $p->ci,
                $p->full_name,
                $p->date_birth,
                $sexMap[$p->sex] ?? $p->sex,
                $civilMap[$p->civil_status] ?? $p->civil_status,
                $ad['degree_obtained'] ?? null,
                $ad['pregraduate_degree'] ?? null,
                $ad['postgraduate_degree'] ?? null,
                $p->address,
                $p->email,
                $p->phone_number,
                $ad['fixed_phone'] ?? null,
                $ad['shirt_size'] ?? null,
                $ad['pant_size'] ?? null,
                $ad['shoe_size'] ?? null,
                $p->asic?->name,
                $p->dependency?->name,
                $p->administrativeUnit?->name,
                $p->department?->name,
                $p->service?->name,
                $ad['entry_date'] ?? null,
                $ad['job_title'] ?? null,
                $ad['labor_relationship'] ?? null,
                $p->typePersonnel?->code,
                $p->typePersonnel?->name,
                $ad['payroll_budget'] ?? null,
                $ad['payroll_dependency'] ?? null,
                $ad['job_code'] ?? null,
                $ad['bank_account_number'] ?? null,
            ], null, 'A' . $rowNum);

            $rowNum++;
        }

        $lastCol = $sheet->getHighestColumn();
        for ($i = 'A'; $i <= $lastCol; $i++) {
            $sheet->getColumnDimension($i)->setAutoSize(true);
        }

        $sheet->setAutoFilter('A1:' . $sheet->getHighestColumn() . '1');

        $writer = new Xlsx($spreadsheet);
        $filename = ($status === 'active' ? 'personal_activo' : 'fe_de_vida') . '_export_' . date('Y-m-d') . '.xlsx';

        return response()->stream(function () use ($writer) {
            $writer->save('php://output');
        }, 200, [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition' => 'attachment; filename="' . $filename . '"',
        ]);
    }

    public function importExcel(Request $request, $status = 'active')
    {
        set_time_limit(0);

        $request->validate([
            'file' => 'required|file|mimes:xlsx,xls'
        ]);

        $dataRows = [];

        $import = new class($dataRows) implements ToCollection, WithHeadingRow {
            public array $rows;

            public function __construct(array &$rows)
            {
                $this->rows = &$rows;
            }

            public function collection(Collection $rows)
            {
                $this->rows = $rows->toArray();
            }

            public function headingRow(): int
            {
                return 1;
            }
        };

        Excel::import($import, $request->file('file'));

        $allAsics = ASIC::all()->keyBy('name');
        $allDependencies = Dependency::all()->keyBy('name');
        $allAdminUnits = AdministrativeUnit::all()->keyBy('name');
        $allDepartments = Department::all()->keyBy('name');
        $allServices = Service::all()->keyBy('name');
        $allTypePersonnels = TypePersonnel::all();
        $typePersonnelsByCode = $allTypePersonnels->keyBy('code');

        $existingMap = Personnel::select('id', 'ci', 'additional_data')
            ->get()
            ->keyBy('ci');

        $createdCount = 0;
        $updatedCount = 0;
        $errors = [];
        $userId = Auth::id();
        $now = now();
        $nowStr = $now->toDateTimeString();
        $sexMap = ['Masculino' => 'M', 'Femenino' => 'F', 'M' => 'M', 'F' => 'F'];
        $civilMap = ['Soltero' => 'S', 'Casado' => 'C', 'Viudo' => 'V', 'Divorciado' => 'D', 'S' => 'S', 'C' => 'C', 'V' => 'V', 'D' => 'D'];

        $chunks = array_chunk($dataRows, 500, true);

        foreach ($chunks as $chunkIndex => $chunk) {
            $auditLogsBatch = [];

            DB::beginTransaction();

            try {
                foreach ($chunk as $index => $row) {
                    $rowIndex = ($chunkIndex * 500) + $index + 2;
                    $rowData = $row;

                    $ci = trim($rowData['cedula'] ?? '');
                    $fullName = trim($rowData['nombre_completo'] ?? '');

                    if (empty($ci) || empty($fullName)) {
                        $errors[] = "Fila $rowIndex: Cedula o Nombre vacios";
                        continue;
                    }

                    $dateBirthValue = $rowData['fecha_nacimiento_yyyy_mm_dd'] ?? null;
                    $dateBirth = $this->excelDateToDate($dateBirthValue);
                    $entryDateValue = $rowData['fecha_ingreso_yyyy_mm_dd'] ?? $rowData['fecha_greso_yyyy_mm_dd'] ?? null;
                    $entryDate = $this->excelDateToDate($entryDateValue);

                    $sex = $sexMap[$rowData['sexo_mf']] ?? $rowData['sexo_mf'] ?? 'Sin asignar';
                    $civilStatus = $civilMap[$rowData['estado_civil_scvd']] ?? $rowData['estado_civil_scvd'] ?? null;

                    $nac = strtoupper(trim($rowData['nac_ve'] ?? 'V'));
                    if (!in_array($nac, ['V', 'E'])) {
                        $nac = 'V';
                    }

                    $asicNombre = trim($rowData['nombre_asic'] ?? '');
                    $dependenciaNombre = trim($rowData['nombre_dependencia'] ?? '');
                    $unidadAdmNombre = trim($rowData['nombre_unidad_adm'] ?? '');
                    $departamentoNombre = trim($rowData['nombre_departamento'] ?? '');
                    $servicioNombre = trim($rowData['nombre_servicio'] ?? '');

                    $asic = $allAsics->get($asicNombre);
                    $dependency = $allDependencies->get($dependenciaNombre);
                    $adminUnit = $allAdminUnits->get($unidadAdmNombre);
                    $department = $allDepartments->get($departamentoNombre);
                    $service = $allServices->get($servicioNombre);

                    if (!empty($asicNombre) && !$asic) {
                        $errors[] = "Fila $rowIndex: ASIC '{$asicNombre}' no encontrado";
                    }
                    if (!empty($dependenciaNombre) && !$dependency) {
                        $errors[] = "Fila $rowIndex: Dependencia '{$dependenciaNombre}' no encontrada";
                    }
                    if (!empty($unidadAdmNombre) && !$adminUnit) {
                        $errors[] = "Fila $rowIndex: Unidad Administrativa '{$unidadAdmNombre}' no encontrada";
                    }
                    if (!empty($departamentoNombre) && !$department) {
                        $errors[] = "Fila $rowIndex: Departamento '{$departamentoNombre}' no encontrado";
                    }
                    if (!empty($servicioNombre) && !$service) {
                        $errors[] = "Fila $rowIndex: Servicio '{$servicioNombre}' no encontrado";
                    }

                    $typePersonnel = null;
                    $codigoNomina = trim($rowData['codigo_nomina'] ?? '');
                    $nombreNomina = trim($rowData['nombre_nomina'] ?? '');

                    if (!empty($codigoNomina) && is_numeric($codigoNomina)) {
                        $typePersonnel = $typePersonnelsByCode->get($codigoNomina);
                    }
                    if (!$typePersonnel && !empty($nombreNomina)) {
                        $typePersonnel = $allTypePersonnels->first(function ($tp) use ($nombreNomina) {
                            return str_contains($tp->name, $nombreNomina);
                        });
                    }

                    if (!empty($codigoNomina) || !empty($nombreNomina)) {
                        if (!$typePersonnel) {
                            $errors[] = "Fila $rowIndex: Nómina '" . ($nombreNomina ?: $codigoNomina) . "' no encontrada";
                        }
                    }

                    $additionalData = [
                        'degree_obtained' => $rowData['grado_obtenido'] ?? null,
                        'pregraduate_degree' => $rowData['titulo_pre_grado'] ?? null,
                        'postgraduate_degree' => $rowData['titulo_post_grado'] ?? null,
                        'fixed_phone' => $rowData['telefono_fijo'] ?? null,
                        'shirt_size' => $rowData['talla_camisa'] ?? null,
                        'pant_size' => $rowData['talla_pantalon'] ?? null,
                        'shoe_size' => $rowData['talla_zapatos'] ?? null,
                        'entry_date' => $entryDate,
                        'job_title' => $rowData['cargo'] ?? null,
                        'labor_relationship' => $rowData['relacion_laboral'] ?? null,
                        'payroll_dependency' => $rowData['dependencia_nomina'] ?? null,
                        'payroll_budget' => $rowData['presupuesto'] ?? null,
                        'job_code' => $rowData['codigo_cargo'] ?? null,
                        'bank_account_number' => trim((string) ($rowData['numero_de_cuenta'] ?? '')),
                    ];

                    $personnelData = [
                        'status' => $status,
                        'type_personnel_id' => $typePersonnel?->id,
                        'nac' => $nac,
                        'ci' => (string) $ci,
                        'full_name' => $fullName,
                        'date_birth' => $dateBirth,
                        'sex' => $sex,
                        'civil_status' => $civilStatus,
                        'address' => $rowData['direccion'] ?? null,
                        'email' => $rowData['email'] ?? null,
                        'phone_number' => $rowData['telefono_movil'] ?? null,
                        'asic_id' => $asic?->id,
                        'dependency_id' => $dependency?->id,
                        'administrative_unit_id' => $adminUnit?->id,
                        'department_id' => $department?->id,
                        'service_id' => $service?->id,
                        'additional_data' => $additionalData,
                    ];

                    $ciStr = (string) $ci;

                    if (isset($existingMap[$ciStr])) {
                        $existing = $existingMap[$ciStr];
                        $oldAdditional = $existing->additional_data ?? [];

                        if (!empty($oldAdditional) && is_array($oldAdditional)) {
                            $personnelData['additional_data'] = array_merge(
                                $oldAdditional,
                                $personnelData['additional_data']
                            );
                        }

                        $existing->update($personnelData);

                        $auditLogsBatch[] = [
                            'action' => 'import_excel_update',
                            'auditable_type' => Personnel::class,
                            'auditable_id' => $existing->id,
                            'user_id' => $userId,
                            'old_values' => null,
                            'new_values' => json_encode($personnelData),
                            'created_at' => $nowStr,
                            'updated_at' => $nowStr,
                        ];

                        $updatedCount++;
                    } else {
                        $personnelData['census_status'] = false;
                        $personnelData['state'] = 'Falcon';
                        $personnelData['city'] = 'Sin asignar';

                        $personnel = Personnel::create($personnelData);

                        $auditLogsBatch[] = [
                            'action' => 'import_excel_create',
                            'auditable_type' => Personnel::class,
                            'auditable_id' => $personnel->id,
                            'user_id' => $userId,
                            'old_values' => null,
                            'new_values' => json_encode($personnelData),
                            'created_at' => $nowStr,
                            'updated_at' => $nowStr,
                        ];

                        $createdCount++;
                    }
                }

                if (!empty($auditLogsBatch)) {
                    AuditLog::insert($auditLogsBatch);
                }

                DB::commit();
            } catch (\Exception $e) {
                DB::rollBack();
                Log::error('Error en importExcel chunk ' . $chunkIndex . ': ' . $e->getMessage());
                throw $e;
            }
        }

        $statusLabel = $status === 'active' ? 'personal activo' : 'fe de vida';

        return response()->json([
            'message' => "Importacion de {$statusLabel} completada. Creados: {$createdCount}, Actualizados: {$updatedCount}, Errores: " . count($errors),
            'created_count' => $createdCount,
            'updated_count' => $updatedCount,
            'total' => $createdCount + $updatedCount,
            'errors' => $errors,
        ]);
    }

    private function excelDateToDate($value): ?string
    {
        if (empty($value)) {
            return null;
        }

        if (is_numeric($value)) {
            return Date::excelToDateTimeObject($value)->format('Y-m-d');
        }

        return $value;
    }

    public function generateReport(Request $request, $status)
    {
        Carbon::setLocale('es');
        $year = $request->year ?? now()->year;

        $personnels = Personnel::where('census_status', true)
            ->where('status', $status)
            ->whereYear('census_date', $year)
            ->with(['asic'])
            ->get();

        if ($personnels->isEmpty()) {
            return response()->json([
                'asics' => [],
                'days' => []
            ]);
        }

        $asics = $personnels
            ->groupBy(function ($personnel) {
                return $personnel->asic->id ?? 'sin-asic';
            })
            ->map(function ($asicPersonnels, $asicId) {
                $asic = $asicPersonnels->first()->asic;
                $asicName = $asic->name ?? 'SIN ASIC';

                if ($asicName == 'SIN ASIC') {
                    Log::warning("ASIC no encontrado para personal id " . $asicPersonnels->first()->id);
                }

                $censadosPorDia = $asicPersonnels
                    ->groupBy(function ($personnel) {
                        return $personnel->census_date->format('Y-m-d');
                    })
                    ->map(function ($dayCensuses) {
                        return count($dayCensuses);
                    })
                    ->toArray();

                return [
                    'id' => $asicId,
                    'name' => $asicName,
                    'censadosPorDia' => $censadosPorDia
                ];
            })
            ->values()
            ->toArray();

        $firstDate = $personnels->min('census_date');
        $lastDate = $personnels->max('census_date');

        $days = [];
        $start = Carbon::parse($firstDate)->startOfDay();
        $end = Carbon::parse($lastDate)->startOfDay();

        while ($start <= $end) {
            $days[] = [
                'id' => $start->format('Y-m-d'),
                'label' => $start->format('d/m')
            ];
            $start->addDay();
        }

        return response()->json([
            'asics' => $asics,
            'days' => $days
        ]);
    }

    public function generateReportWithHospital(Request $request, $status)
    {
        Carbon::setLocale('es');
        $year = $request->year ?? now()->year;

        $personnels = Personnel::where('census_status', true)
            ->where('status', $status)
            ->whereYear('census_date', $year)
            ->with(['asic', 'dependency'])
            ->get();

        if ($personnels->isEmpty()) {
            return response()->json([
                'asics' => [],
                'hospitals' => [],
                'days' => []
            ]);
        }

        $asics = $personnels
            ->groupBy(function ($personnel) {
                return $personnel->asic->id ?? 'sin-asic';
            })
            ->map(function ($asicPersonnels, $asicId) {
                $asic = $asicPersonnels->first()->asic;
                $asicName = $asic->name ?? 'SIN ASIC';

                if ($asicName == 'SIN ASIC') {
                    Log::warning("ASIC no encontrado para personal id " . $asicPersonnels->first()->id);
                }

                $censadosPorDia = $asicPersonnels
                    ->groupBy(function ($personnel) {
                        return $personnel->census_date->format('Y-m-d');
                    })
                    ->map(function ($dayCensuses) {
                        return count($dayCensuses);
                    })
                    ->toArray();

                return [
                    'id' => $asicId,
                    'name' => $asicName,
                    'censadosPorDia' => $censadosPorDia
                ];
            })
            ->values()
            ->toArray();

        $hospitals = $personnels
            ->filter(function ($personnel) {
                if (!$personnel->dependency) {
                    return false;
                }

                $name = mb_strtolower($personnel->dependency->name);

                return str_contains($name, 'hospital') ||
                    str_contains($name, 'mision sonrisa') ||
                    str_contains($name, 'misión sonrisa') ||
                    str_contains($name, 'secretaria de salud') ||
                    str_contains($name, 'secretaría de salud');
            })
            ->groupBy(function ($personnel) {
                return $personnel->dependency->id;
            })
            ->map(function ($hospitalPersonnels, $hospitalId) {
                $hospitalName = $hospitalPersonnels->first()->dependency->name;

                $censadosPorDia = $hospitalPersonnels
                    ->groupBy(function ($personnel) {
                        return $personnel->census_date->format('Y-m-d');
                    })
                    ->map(function ($dayCensuses) {
                        return count($dayCensuses);
                    })
                    ->toArray();

                return [
                    'id' => $hospitalId,
                    'name' => $hospitalName,
                    'censadosPorDia' => $censadosPorDia
                ];
            })
            ->values()
            ->toArray();

        $firstDate = $personnels->min('census_date');
        $lastDate = $personnels->max('census_date');

        $days = [];
        $start = Carbon::parse($firstDate)->startOfDay();
        $end = Carbon::parse($lastDate)->startOfDay();

        while ($start <= $end) {
            $days[] = [
                'id' => $start->format('Y-m-d'),
                'label' => $start->format('d/m')
            ];
            $start->addDay();
        }

        return response()->json([
            'asics' => $asics,
            'hospitals' => $hospitals,
            'days' => $days
        ]);
    }
}

