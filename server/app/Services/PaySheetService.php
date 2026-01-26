<?php

namespace App\Services;

use Exception;
use App\Models\PaySheet;
use App\Models\TypePaySheet;
use Illuminate\Http\Request;
use Maatwebsite\Excel\Facades\Excel;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\ValidationException;

class PaySheetService
{

    public function get($params = [])
    {
        $query = PaySheet::query()->with('typePaySheet');

        if (!empty($params['search'])) {
            $search = $params['search'];
            $query->where(function ($q) use ($search) {
                $q->where('ci', 'LIKE', "%{$search}%")
                    ->orWhere('full_name', 'LIKE', "%{$search}%")
                    ->orWhereHas('typePaySheet', function ($subQuery) use ($search) {
                        $subQuery->where('name', 'LIKE', "%{$search}%")
                            ->orWhere('code', 'LIKE', "%{$search}%");
                    });
            });
        }

        if (!empty($params['type_pay_sheet_id'])) {
            $query->where('type_pay_sheet_id', $params['type_pay_sheet_id']);
        }

        if (!empty($params['sex'])) {
            $query->where('sex', $params['sex']);
        }

        $sortField = $params['sort_by'] ?? 'created_at';
        $sortDirection = $params['sort_direction'] ?? 'desc';

        $allowedSortFields = ['ci', 'full_name', 'date_birth', 'sex', 'created_at'];
        if (!in_array($sortField, $allowedSortFields)) {
            $sortField = 'created_at';
        }

        $query->orderBy($sortField, $sortDirection);

        $perPage = $params['per_page'] ?? 15;
        $perPage = max(1, min(100, $perPage));

        return $query->paginate($perPage);
    }


    public function store(Request $request)
    {
        // Validar que se subió un archivo
        $validator = Validator::make($request->all(), [
            'file' => 'required|file|mimes:xlsx,xls,csv'
        ]);

        if ($validator->fails()) {
            throw new ValidationException($validator);
        }

        // Leer el archivo Excel
        $file = $request->file('file');
        $data = Excel::toArray([], $file);

        if (empty($data[0])) {
            throw new Exception('El archivo está vacío');
        }

        // Eliminar la primera fila (encabezados)
        $rows = array_slice($data[0], 1);

        $inserted = 0;
        $errors = [];

        foreach ($rows as $index => $row) {
            try {
                // Validar que la fila tenga datos
                if (empty($row[0]) && empty($row[1])) {
                    continue; // Saltar filas vacías
                }

                // Mapear las columnas según el formato del Excel
                $cedula = $row[0] ?? '';
                $nombreCompleto = $row[1] ?? '';
                $fechaNacimiento = $row[2] ?? '';
                $sexo = $row[3] ?? '';
                $tipoPersonal = $row[4] ?? '';
                $codigo = $row[5] ?? '';

                // Validar datos requeridos
                if (empty($cedula) || empty($nombreCompleto)) {
                    $errors[] = "Fila " . ($index + 2) . ": Cédula y Nombre son requeridos";
                    continue;
                }

                // Buscar o crear el TypePaySheet basado en código o nombre
                if (!empty($codigo)) {
                    $typePaySheet = TypePaySheet::firstOrCreate(
                        ['code' => $codigo],
                        ['name' => $tipoPersonal]
                    );
                } else {
                    $typePaySheet = TypePaySheet::firstOrCreate(
                        ['name' => $tipoPersonal]
                    );
                }

                // Crear o actualizar el registro en pay_sheets
                PaySheet::updateOrCreate(
                    [
                        'ci' => $cedula,
                    ],
                    [
                        'full_name' => $nombreCompleto,
                        'date_birth' => $this->formatDate($fechaNacimiento),
                        'sex' => $this->formatSex($sexo),
                        'type_pay_sheet_id' => $typePaySheet->id,
                    ]
                );

                $inserted++;
            } catch (\Exception $e) {
                $errors[] = "Fila " . ($index + 2) . ": " . $e->getMessage();
            }
        }

        return [
            'inserted' => $inserted,
            'errors' => $errors
        ];
    }

    private function formatDate($date)
    {
        if (empty($date)) {
            return null;
        }

        try {
            if (is_numeric($date)) {
                $unixDate = ($date - 25569) * 86400;
                return date('Y-m-d', $unixDate);
            } else {
                return date('Y-m-d', strtotime($date));
            }
        } catch (\Exception $e) {
            return null;
        }
    }

    private function formatSex($sex)
    {
        $sex = strtoupper(trim($sex));

        if ($sex == 'M' || $sex == 'MASCULINO' || $sex == 'HOMBRE') {
            return 'M';
        } elseif ($sex == 'F' || $sex == 'FEMENINO' || $sex == 'MUJER') {
            return 'F';
        }

        return $sex;
    }
}
