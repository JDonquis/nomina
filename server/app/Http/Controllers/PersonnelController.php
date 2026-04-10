<?php

namespace App\Http\Controllers;

use App\Http\Requests\StorePersonnelRequest;
use App\Http\Requests\UpdatePersonnelRequest;
use App\Http\Requests\UpdatePhotoPersonnelRequest;
use App\Services\PersonnelService;
use App\Models\ASIC;
use App\Models\Dependency;
use App\Models\AdministrativeUnit;
use App\Models\Department;
use App\Models\Service;
use App\Models\TypePersonnel;
use Exception;
use App\Models\Personnel;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use App\Models\AuditLog;
use Maatwebsite\Excel\Facades\Excel;
use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\ToCollection;
use Maatwebsite\Excel\Concerns\WithHeadingRow;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;

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
        $personnels = $this->personnelService->get($request->all(), 'active');

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
        $request->validate([
            'file' => 'required|file|mimes:xlsx,xls'
        ]);

        try {
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

            $headers = !empty($dataRows[0] ?? []) ? array_keys($dataRows[0]) : [];

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
                    'user_id' => auth()->id() ?? null,
                    'old_values' => null,
                    'new_values' => $personnel->toArray(),
                ]);

                $data[] = [
                    'row' => $rowIndex,
                    'id' => $personnel->id,
                    'status' => 'active',
                    'census_status' => false,
                    'type_personnel_id' => $typePersonnel?->id,
                    'type_personnel_code' => $codigoNomina,
                    'type_personnel_name' => $nombreNomina,
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
                    'asic_name' => $rowData['nombre_asic'] ?? null,
                    'dependency_id' => $dependency?->id,
                    'dependency_name' => $rowData['nombre_dependencia'] ?? null,
                    'administrative_unit_id' => $adminUnit?->id,
                    'administrative_unit_name' => $rowData['nombre_unidad_adm'] ?? null,
                    'department_id' => $department?->id,
                    'department_name' => $rowData['nombre_departamento'] ?? null,
                    'service_id' => $service?->id,
                    'service_name' => $rowData['nombre_servicio'] ?? null,
                    'entry_date' => $entryDate,
                    'job_title' => $rowData['cargo'] ?? null,
                    'bank_account_number' => (string) ($rowData['numero_de_cuenta'] ?? ''),
                    'job_code' => $rowData['codigo_cargo'] ?? null,
                    'is_resident' => false,
                    'additional_data' => [
                        'degree_obtained' => $rowData['grado_obtenido'] ?? null,
                        'postgraduate_degree' => $rowData['titulo_post_grado'] ?? null,
                        'mobile_phone' => $rowData['telefono_movil'] ?? null,
                        'fixed_phone' => $rowData['telefono_fijo'] ?? null,
                        'shirt_size' => $rowData['talla_camisa'] ?? null,
                        'pant_size' => $rowData['talla_pantalon'] ?? null,
                        'shoe_size' => $rowData['talla_zapatos'] ?? null,
                        'payroll_dependency' => $rowData['dependencia_nómina'] ?? null,
                        'payroll_code' => $rowData['codigo_nomina'] ?? null,
                        'payroll_name' => $rowData['nombre_nomina'] ?? null,
                        'budget' => $rowData['presupuesto'] ?? null,
                    ],
                ];
            }

            return response()->json([
                'data' => $data,
                'total' => count($data),
                'errors' => $errors
            ]);
        } catch (Exception $e) {
            Log::error('Error al importar Excel: ', [
                'message' => $e->getMessage(),
                'line' => $e->getLine()
            ]);

            return response()->json([
                'status' => false,
                'message' => 'Error al importar Excel: ' . $e->getMessage()
            ], 500);
        }
    }

    private function excelDateToDate($value): ?string
    {
        if (empty($value)) {
            return null;
        }

        if (is_numeric($value)) {
            return \PhpOffice\PhpSpreadsheet\Shared\Date::excelToDateTimeObject($value)->format('Y-m-d');
        }

        return $value;
    }
}
