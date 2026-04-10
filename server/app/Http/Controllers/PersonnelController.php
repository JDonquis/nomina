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
use PhpOffice\PhpSpreadsheet\IOFactory;
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
            'NAC (V/E)', 'CEDULA', 'NOMBRE COMPLETO', 'FECHA NACIMIENTO (YYYY-MM-DD)',
            'SEXO (M/F)', 'ESTADO CIVIL (S/C/V/D)', 'GRADO OBTENIDO', 'TITULO PRE GRADO',
            'TITULO POST GRADO', 'DIRECCION', 'EMAIL', 'TELEFONO MOVIL', 'TELEFONO FIJO',
            'TALLA CAMISA', 'TALLA PANTALON', 'TALLA ZAPATOS', 'NOMBRE ASIC',
            'NOMBRE DEPENDENCIA', 'NOMBRE UNIDAD ADM', 'NOMBRE DEPARTAMENTO', 'NOMBRE SERVICIO',
            'FECHA INGRESO (YYYY-MM-DD)', 'CARGO', 'RELACION LABORAL', 'CODIGO NOMINA',
            'NOMBRE NOMINA', 'PRESUPUESTO', 'DEPENDENCIA NÓMINA', 'CODIGO CARGO', 'NUMERO DE CUENTA'
        ];

        $sheet->fromArray($headers, null, 'A1');

        $columns = ['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T','U','V','W','X','Y','Z','AA','AB','AC','AD'];
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
            $file = $request->file('file');
            $spreadsheet = IOFactory::load($file);
            $sheet = $spreadsheet->getSheetByName('DATA PERSONAL');

            $headers = [];
            foreach ($sheet->getRowIterator()->current()->getCellIterator() as $cell) {
                $headers[trim($cell->getColumn())] = trim($cell->getValue() ?? '');
            }

            $created = 0;
            $errors = [];

            $rowIterator = $sheet->getRowIterator();
            $rowIndex = 1;
            foreach ($rowIterator as $row) {
                if ($rowIndex === 1) {
                    $rowIndex++;
                    continue;
                }

                $rowData = [];
                foreach ($row->getCellIterator() as $cell) {
                    $col = trim($cell->getColumn());
                    $header = $headers[$col] ?? '';
                    $value = $cell->getValue();
                    $rowData[$header] = $value;
                }

                $ci = $rowData['CEDULA'] ?? null;
                $fullName = $rowData['NOMBRE COMPLETO'] ?? null;

                if (empty($ci) || empty($fullName)) {
                    $errors[] = "Fila $rowIndex sin Cédula o Nombre";
                    $rowIndex++;
                    continue;
                }

                $dateBirth = null;
                if (!empty($rowData['FECHA NACIMIENTO (YYYY-MM-DD)'])) {
                    $dateValue = $rowData['FECHA NACIMIENTO (YYYY-MM-DD)'];
                    if (is_numeric($dateValue)) {
                        $dateBirth = \PhpOffice\PhpSpreadsheet\Shared\Date::excelToDateTimeObject($dateValue)->format('Y-m-d');
                    } else {
                        $dateBirth = $dateValue;
                    }
                }

                $entryDate = null;
                if (!empty($rowData['FECHA INGRESO (YYYY-MM-DD)'])) {
                    $entryValue = $rowData['FECHA INGRESO (YYYY-MM-DD)'];
                    if (is_numeric($entryValue)) {
                        $entryDate = \PhpOffice\PhpSpreadsheet\Shared\Date::excelToDateTimeObject($entryValue)->format('Y-m-d');
                    } else {
                        $entryDate = $entryValue;
                    }
                }

                $sexMap = ['Masculino' => 'M', 'Femenino' => 'F'];
                $sex = $sexMap[$rowData['SEXO (M/F)']] ?? $rowData['SEXO (M/F)'];

                $civilMap = ['Soltero' => 'S', 'Casado' => 'C', 'Viudo' => 'V', 'Divorciado' => 'D'];
                $civilStatus = $civilMap[$rowData['ESTADO CIVIL (S/C/V/D)']] ?? $rowData['ESTADO CIVIL (S/C/V/D)'];

                $asic = ASIC::where('name', $rowData['NOMBRE ASIC'] ?? null)->first();
                $dependency = Dependency::where('name', $rowData['NOMBRE DEPENDENCIA'] ?? null)->first();
                $adminUnit = AdministrativeUnit::where('name', $rowData['NOMBRE UNIDAD ADM'] ?? null)->first();
                $department = Department::where('name', $rowData['NOMBRE DEPARTAMENTO'] ?? null)->first();
                $service = Service::where('name', $rowData['NOMBRE SERVICIO'] ?? null)->first();

                $typePersonnel = null;
                $codigoNomina = $rowData['CODIGO NOMINA'] ?? '';
                $nombreNomina = $rowData['NOMBRE NOMINA'] ?? '';

                Log::info("Fila $rowIndex - CODIGO NOMINA: '$codigoNomina', NOMBRE NOMINA: '$nombreNomina'");

                if (!empty($codigoNomina) && is_numeric($codigoNomina)) {
                    $typePersonnel = TypePersonnel::where('code', $codigoNomina)->first();
                }
                if (!$typePersonnel && !empty($nombreNomina)) {
                    $typePersonnel = TypePersonnel::where('name', 'LIKE', '%' . $nombreNomina . '%')->first();
                }

                Log::info("Fila $rowIndex - TypePersonnel encontrado: " . ($typePersonnel ? $typePersonnel->id : 'NULL'));

                $personnel = Personnel::create([
                    'status' => 'active',
                    'census_status' => false,
                    'type_personnel_id' => $typePersonnel?->id,
                    'nac' => $rowData['NAC (V/E)'] ?? 'V',
                    'ci' => (string) $ci,
                    'full_name' => $fullName,
                    'date_birth' => $dateBirth,
                    'sex' => $sex,
                    'civil_status' => $civilStatus,
                    'address' => $rowData['DIRECCION'] ?? null,
                    'email' => $rowData['EMAIL'] ?? null,
                    'phone_number' => $rowData['TELEFONO MOVIL'] ?? null,
                    'state' => 'Falcón',
                    'city' => 'Sin asignar',
                    'asic_id' => $asic?->id,
                    'dependency_id' => $dependency?->id,
                    'administrative_unit_id' => $adminUnit?->id,
                    'department_id' => $department?->id,
                    'service_id' => $service?->id,
                    'entry_date' => $entryDate,
                    'job_title' => $rowData['CARGO'] ?? null,
                    'bank_account_number' => (string) ($rowData['NUMERO DE CUENTA'] ?? ''),
                    'job_code' => $rowData['CODIGO CARGO'] ?? null,
                    'is_resident' => false,
                    'additional_data' => [
                        'degree_obtained' => $rowData['GRADO OBTENIDO'] ?? null,
                        'postgraduate_degree' => $rowData['TITULO POST GRADO'] ?? null,
                        'mobile_phone' => $rowData['TELEFONO MOVIL'] ?? null,
                        'fixed_phone' => $rowData['TELEFONO FIJO'] ?? null,
                        'shirt_size' => $rowData['TALLA CAMISA'] ?? null,
                        'pant_size' => $rowData['TALLA PANTALON'] ?? null,
                        'shoe_size' => $rowData['TALLA ZAPATOS'] ?? null,
                        'payroll_dependency' => $rowData['DEPENDENCIA NÓMINA'] ?? null,
                        'payroll_code' => $rowData['CODIGO NOMINA'] ?? null,
                        'payroll_name' => $rowData['NOMBRE NOMINA'] ?? null,
                        'budget' => $rowData['PRESUPUESTO'] ?? null,
                    ],
                ]);

                $created++;
                $rowIndex++;
            }

            return response()->json([
                'message' => 'Importación completada',
                'created' => $created,
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
}
