<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithStyles;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class ActivePersonnelExport implements FromCollection, WithHeadings, WithStyles
{
    /**
    * @return \Illuminate\Support\Collection
    */
    public function collection()
    {
        // Retornamos una colección vacía o con una fila de ejemplo
        return collect([
            [
                'V',
                '12345678',
                'JUAN PEREZ',
                '1990-01-01',
                'M',
                'S',
                'LICENCIADO EN ENFERMERIA',
                '',
                'CALLE FALCON, CORO',
                'juan.perez@email.com',
                '04120000000',
                '',
                'M',
                '32',
                '40',
                'ASIC Carlina Luchon', // Nombre del ASIC exacto
                'DEPENDENCIA EJEMPLO',
                'UNIDAD EJEMPLO',
                'DEPARTAMENTO EJEMPLO',
                'SERVICIO EJEMPLO',
                '2020-01-15',
                'ENFERMERO I',
                'FIJO',
                '001',
                'NOMINA EJEMPLO'
            ]
        ]);
    }

    public function headings(): array
    {
        return [
            'NAC (V/E)',
            'CEDULA',
            'NOMBRE COMPLETO',
            'FECHA NACIMIENTO (YYYY-MM-DD)',
            'SEXO (M/F)',
            'ESTADO CIVIL (S/C/V/D)',
            'GRADO OBTENIDO',
            'POSTGRADO',
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
            'NOMBRE NOMINA'
        ];
    }

    public function styles(Worksheet $sheet)
    {
        return [
            1 => ['font' => ['bold' => true]],
        ];
    }
}
