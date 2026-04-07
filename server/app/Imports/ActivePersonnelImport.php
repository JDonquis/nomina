<?php

namespace App\Imports;

use App\Models\ActivePersonnel;
use App\Models\ASIC;
use App\Models\Dependency;
use App\Models\AdministrativeUnit;
use App\Models\Department;
use App\Models\Service;
use Maatwebsite\Excel\Concerns\ToModel;
use Maatwebsite\Excel\Concerns\WithHeadingRow;
use Illuminate\Support\Facades\Auth;

class ActivePersonnelImport implements ToModel, WithHeadingRow
{
    /**
    * @param array $row
    *
    * @return \Illuminate\Database\Eloquent\Model|null
    */
    public function model(array $row)
    {
        // El mapeo depende de los headings del export
        // Maatwebsite convierte los headings a slugs (ej: "NAC (V/E)" -> "nac_ve")
        
        // Mapeo manual basado en índices si slugs son inciertos
        // Pero usaremos nombres de columnas limpios para facilitar
    }
}
