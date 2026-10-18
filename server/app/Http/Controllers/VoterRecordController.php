<?php

namespace App\Http\Controllers;

use App\Models\ASIC;
use App\Models\Dependency;
use App\Models\Personnel;
use App\Models\VoterRecord;
use Illuminate\Database\QueryException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;

class VoterRecordController extends Controller
{
    private function normalizeName(?string $name): string
    {
        return Str::ascii(mb_strtolower(trim((string) $name)));
    }

    private function isHealthSecretariat(string $normalizedName): bool
    {
        return str_contains($normalizedName, 'secretaria de salud')
            || (str_contains($normalizedName, 'secretaria') && str_contains($normalizedName, 'salud'));
    }

    private function isHospital(string $normalizedName): bool
    {
        return str_contains($normalizedName, 'hospital')
            || str_contains($normalizedName, 'mision sonrisa')
            || str_contains($normalizedName, 'sonrisa');
    }

    public function centers(): JsonResponse
    {
        $asics = ASIC::orderBy('name')->get(['id', 'name']);

        $dependencies = Dependency::orderBy('name')->get(['id', 'asic_id', 'name']);

        $hospitals = $dependencies
            ->filter(function (Dependency $dependency) {
                $normalized = $this->normalizeName($dependency->name);

                return $this->isHospital($normalized) && !$this->isHealthSecretariat($normalized);
            })
            ->map(function (Dependency $dependency) {
                return [
                    'id' => $dependency->id,
                    'name' => $dependency->name,
                    'asic_id' => $dependency->asic_id,
                ];
            })
            ->values();

        $healthSecretariat = $dependencies
            ->filter(function (Dependency $dependency) {
                return $this->isHealthSecretariat($this->normalizeName($dependency->name));
            })
            ->map(function (Dependency $dependency) {
                return [
                    'id' => $dependency->id,
                    'name' => $dependency->name,
                ];
            })
            ->values();

        if ($healthSecretariat->isEmpty()) {
            $healthSecretariat = collect([
                ['id' => null, 'name' => 'Secretaría de Salud'],
            ]);
        }

        return response()->json([
            'asics' => $asics,
            'hospitals' => $hospitals,
            'health_secretariat' => $healthSecretariat,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'ci' => ['required', 'string', 'max:20'],
            'center_type' => ['required', Rule::in(['asic', 'hospital', 'health_secretariat'])],
            'center_id' => ['nullable', 'integer'],
        ]);

        $ci = preg_replace('/\D+/', '', $validated['ci']);

        if ($ci === '') {
            return response()->json([
                'message' => 'Debe ingresar una cédula válida.',
            ], 422);
        }

        $centerType = $validated['center_type'];
        $centerId = $validated['center_id'] ?? null;
        $asicId = null;
        $dependencyId = null;
        $centerName = null;

        if ($centerType === 'asic') {
            if (!$centerId) {
                return response()->json(['message' => 'Debe seleccionar un ASIC.'], 422);
            }

            $asic = ASIC::find($centerId);
            if (!$asic) {
                return response()->json(['message' => 'El ASIC seleccionado no existe.'], 422);
            }

            $asicId = $asic->id;
            $centerName = $asic->name;
        } elseif ($centerType === 'hospital') {
            if (!$centerId) {
                return response()->json(['message' => 'Debe seleccionar un hospital.'], 422);
            }

            $dependency = Dependency::find($centerId);
            if (!$dependency) {
                return response()->json(['message' => 'El hospital seleccionado no existe.'], 422);
            }

            $dependencyId = $dependency->id;
            $asicId = $dependency->asic_id;
            $centerName = $dependency->name;
        } else {
            if ($centerId) {
                $dependency = Dependency::find($centerId);
                if (!$dependency) {
                    return response()->json(['message' => 'La dependencia seleccionada no existe.'], 422);
                }

                $dependencyId = $dependency->id;
                $asicId = $dependency->asic_id;
                $centerName = $dependency->name;
            } else {
                $centerName = 'Secretaría de Salud';
            }
        }

        if (VoterRecord::where('ci', $ci)->exists()) {
            return response()->json([
                'message' => 'Esta cédula ya fue registrada.',
            ], 409);
        }

        $personnel = Personnel::where('ci', $ci)
            ->where('status', 'active')
            ->first();

        try {
            $record = VoterRecord::create([
                'ci' => $ci,
                'full_name' => $personnel?->full_name,
                'personnel_id' => $personnel?->id,
                'center_type' => $centerType,
                'asic_id' => $asicId,
                'dependency_id' => $dependencyId,
                'center_name' => $centerName,
                'user_id' => $request->user()?->id,
                'voted_at' => now(),
            ]);
        } catch (QueryException $exception) {
            if ((int) $exception->getCode() === 23000) {
                return response()->json([
                    'message' => 'Esta cédula ya fue registrada.',
                ], 409);
            }

            throw $exception;
        }

        return response()->json([
            'message' => 'Voto registrado exitosamente.',
            'record' => [
                'id' => $record->id,
                'voted_at' => $record->voted_at?->toIso8601String(),
            ],
        ], 201);
    }

    public function export()
    {
        $records = VoterRecord::with(['asic', 'dependency', 'personnel', 'user'])
            ->orderBy('voted_at', 'desc')
            ->get();

        $centerTypeMap = [
            'asic' => 'ASIC',
            'hospital' => 'Hospital',
            'health_secretariat' => 'Secretaría de Salud',
        ];

        $spreadsheet = new Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();
        $sheet->setTitle('Votantes');

        $headers = [
            'Cédula',
            'Nombre y Apellido',
            'Cargo',
            'Tipo de Centro',
            'Centro de Adscripción',
            'ASIC',
            'Dependencia',
            'Vinculado a Personal Activo',
            'Fecha de Voto',
            'Registrado por',
        ];

        $sheet->fromArray($headers, null, 'A1');

        $headerStyle = [
            'font' => ['bold' => true, 'color' => ['rgb' => 'FFFFFF']],
            'fill' => ['fillType' => 'solid', 'startColor' => ['rgb' => '011140']],
            'alignment' => ['horizontal' => 'center'],
        ];
        $sheet->getStyle('A1:' . $sheet->getHighestColumn() . '1')->applyFromArray($headerStyle);

        $rowNum = 2;
        foreach ($records as $record) {
            $sheet->fromArray([
                $record->ci,
                $record->full_name ?? $record->personnel?->full_name,
                $record->personnel?->additional_data['job_title'] ?? null,
                $centerTypeMap[$record->center_type] ?? $record->center_type,
                $record->center_name,
                $record->asic?->name,
                $record->dependency?->name,
                $record->personnel_id ? 'Sí' : 'No',
                $record->voted_at?->format('d/m/Y H:i'),
                $record->user?->full_name,
            ], null, 'A' . $rowNum);

            $rowNum++;
        }

        $lastCol = $sheet->getHighestColumn();
        for ($i = 'A'; $i <= $lastCol; $i++) {
            $sheet->getColumnDimension($i)->setAutoSize(true);
        }

        $sheet->setAutoFilter('A1:' . $lastCol . '1');

        $writer = new Xlsx($spreadsheet);
        $filename = 'votantes_export_' . date('Y-m-d') . '.xlsx';

        return response()->stream(function () use ($writer) {
            $writer->save('php://output');
        }, 200, [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition' => 'attachment; filename="' . $filename . '"',
        ]);
    }
}
