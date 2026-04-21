<?php

namespace App\Services;

use App\Models\ASIC;
use App\Models\AdministrativeUnit;
use App\Models\AuditLog;
use App\Models\Department;
use App\Models\Dependency;
use App\Models\Personnel;
use App\Models\Service;
use App\Models\TypePersonnel;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Maatwebsite\Excel\Facades\Excel;
use Maatwebsite\Excel\Concerns\ToCollection;
use Maatwebsite\Excel\Concerns\WithHeadingRow;
use PhpOffice\PhpSpreadsheet\Shared\Date;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use Carbon\Carbon;

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
            'postgraduate_degree',
            'mobile_phone',
            'fixed_phone',
            'shirt_size',
            'pant_size',
            'shoe_size',
        ],
    ];

    public function get($params = [], $type = 'inactive')
    {
        $query = Personnel::query()->with(['typePersonnel', 'asic', 'dependency', 'administrativeUnit', 'department', 'service']);

        $query->where('status', $type === 'active' ? 'active' : 'inactive');

        if (isset($params['census_status'])) {
            $censusStatus = $params['census_status'] === 'CENSADO' || $params['census_status'] === true;
            $query->where('census_status', $censusStatus);
        }

        if (!empty($params['search'])) {
            $search = $params['search'];
            $query->where(function ($q) use ($search) {
                $q->where('full_name', 'LIKE', "%{$search}%")
                    ->orWhere('ci', 'LIKE', "%{$search}%");
            });
        }

        $filters = [];
        if (!empty($params['filters'])) {
            $filters = is_string($params['filters']) ? json_decode($params['filters'], true) : $params['filters'];

            if (isset($filters['status'])) {
                $query->where('status', $filters['status']);
            }

            if (isset($filters['type_personnel_id'])) {
                $query->where('type_personnel_id', $filters['type_personnel_id']);
            }

            if (isset($filters['census_status'])) {
                $censusStatus = $filters['census_status'] === 'CENSADO';
                $query->where('census_status', $censusStatus);
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

            if (isset($filters['asic_id'])) {
                $query->where('asic_id', $filters['asic_id']);
            }

            if (isset($filters['dependency_id'])) {
                $query->where('dependency_id', $filters['dependency_id']);
            }
        }

        $sortField = $filters['sort_by'] ?? 'id';
        $sortDirection = $filters['sort_direction'] ?? 'desc';
        $query->orderBy($sortField, $sortDirection);

        $perPage = $filters['per_page'] ?? 15;
        $perPage = max(1, min(100, $perPage));

        return $query->paginate($perPage);
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

    public function exportTemplate()
    {
        $spreadsheet = new Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();

        $headers = [
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
            'DEPENDENCIA NÓMINA',
            'CODIGO CARGO',
            'NUMERO DE CUENTA'
        ];

        $sheet->fromArray($headers, null, 'A1');

        $columns = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', 'AA', 'AB', 'AC', 'AD'];
        foreach ($columns as $col) {
            $sheet->getColumnDimension($col)->setAutoSize(true);
        }

        $writer = new Xlsx($spreadsheet);
        $filename = 'plantilla_personal_activo.xlsx';

        return response()->stream(function () use ($writer) {
            $writer->save('php://output');
        }, 200, [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition' => 'attachment; filename="' . $filename . '"',
        ]);
    }

    public function importExcel(Request $request)
    {
        set_time_limit(120);

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

        $data = [];
        $errors = [];

        foreach ($dataRows as $index => $row) {
            $rowIndex = $index + 1;
            $rowData = $row;

            $ci = $rowData['cedula'] ?? null;
            $fullName = $rowData['nombre_completo'] ?? null;

            if (empty($ci) || empty($fullName)) {
                $errors[] = "Fila $rowIndex sin Cédula o Nombre";
                continue;
            }

            if (Personnel::where('ci', $ci)->exists()) {
                $errors[] = "Fila $rowIndex: Cédula $ci ya existe";
                continue;
            }

            $dateBirthValue = $rowData['fecha_nacimiento_yyyy_mm_dd'] ?? null;
            $dateBirth = $this->excelDateToDate($dateBirthValue);
            $entryDateValue = $rowData['fecha_greso_yyyy_mm_dd'] ?? null;
            $entryDate = $this->excelDateToDate($entryDateValue);

            $sexMap = ['Masculino' => 'M', 'Femenino' => 'F'];
            $sex = $sexMap[$rowData['sexo_mf']] ?? $rowData['sexo_mf'] ?? 'M';

            $civilMap = ['Soltero' => 'S', 'Casado' => 'C', 'Viudo' => 'V', 'Divorciado' => 'D'];
            $civilStatus = $civilMap[$rowData['estado_civil_scvd']] ?? $rowData['estado_civil_scvd'] ?? 'S';

            $asic = ASIC::where('name', $rowData['nombre_asic'] ?? null)->first();
            $dependency = Dependency::where('name', $rowData['nombre_dependencia'] ?? null)->first();
            $adminUnit = AdministrativeUnit::where('name', $rowData['nombre_unidad_adm'] ?? null)->first();
            $department = Department::where('name', $rowData['nombre_departamento'] ?? null)->first();
            $service = Service::where('name', $rowData['nombre_servicio'] ?? null)->first();

            $typePersonnel = null;
            $codigoNomina = $rowData['codigo_nomina'] ?? '';
            $nombreNomina = $rowData['nombre_nomina'] ?? '';

            if (!empty($codigoNomina) && is_numeric($codigoNomina)) {
                $typePersonnel = TypePersonnel::where('code', $codigoNomina)->first();
            }
            if (!$typePersonnel && !empty($nombreNomina)) {
                $typePersonnel = TypePersonnel::where('name', 'LIKE', '%' . $nombreNomina . '%')->first();
            }

            $personnel = Personnel::create([
                'status' => 'active',
                'census_status' => false,
                'type_personnel_id' => $typePersonnel?->id,
                'nac' => $rowData['nac_ve'] ?? 'V',
                'ci' => (string) $ci,
                'full_name' => $fullName,
                'date_birth' => $dateBirth,
                'sex' => $sex,
                'civil_status' => $civilStatus,
                'address' => $rowData['direccion'] ?? null,
                'email' => $rowData['email'] ?? null,
                'phone_number' => $rowData['telefono_movil'] ?? null,
                'state' => 'Falcón',
                'city' => 'Sin asignar',
                'asic_id' => $asic?->id,
                'dependency_id' => $dependency?->id,
                'administrative_unit_id' => $adminUnit?->id,
                'department_id' => $department?->id,
                'service_id' => $service?->id,
                'is_resident' => false,
                'additional_data' => [
                    'degree_obtained' => $rowData['grado_obtenido'] ?? null,
                    'postgraduate_degree' => $rowData['titulo_post_grado'] ?? null,
                    'fixed_phone' => $rowData['telefono_fijo'] ?? null,
                    'shirt_size' => $rowData['talla_camisa'] ?? null,
                    'pant_size' => $rowData['talla_pantalon'] ?? null,
                    'shoe_size' => $rowData['talla_zapatos'] ?? null,
                    'payroll_dependency' => $rowData['dependencia_nómina'] ?? null,
                    'entry_date' => $entryDate,
                    'job_title' => $rowData['cargo'] ?? null,
                    'bank_account_number' => (string) ($rowData['numero_de_cuenta'] ?? ''),
                    'job_code' => $rowData['codigo_cargo'] ?? null,
                ],
            ]);

            AuditLog::create([
                'action' => 'import_excel',
                'auditable_type' => Personnel::class,
                'auditable_id' => $personnel->id,
                'user_id' => Auth::id() ?? null,
                'old_values' => null,
                'new_values' => $personnel->toArray(),
            ]);

            $data[] = $personnel;
        }

        return response()->json([
            'data' => $data,
            'total' => count($data),
            'errors' => $errors
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

    public function generateReport()
    {
        Carbon::setLocale('es');

        $year = $year ?? now()->year;

        $censusLogs = AuditLog::where('auditable_type', Personnel::class)
            ->whereIn('action', ['create_and_census', 'update_and_census'])
            ->whereYear('created_at', $year)
            ->orderBy('created_at')
            ->get()
            ->groupBy('auditable_id')
            ->map(function ($logs) {
                return $logs->first()->created_at;
            });

        if ($censusLogs->isEmpty()) {
            return response()->json([
                'asics' => [],
                'days' => []
            ]);
        }

        $personnelIds = $censusLogs->keys()->toArray();

        $personnels = Personnel::whereIn('id', $personnelIds)
            ->where('census_status', true)
            ->where('status', 'inactive')
            ->with(['asic'])
            ->get()
            ->map(function ($personnel) use ($censusLogs) {
                $personnel->census_date = $censusLogs->get($personnel->id);
                return $personnel;
            });

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
}
