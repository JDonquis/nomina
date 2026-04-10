<?php

namespace Database\Seeders;

use App\Models\TypePersonnel;
use Illuminate\Database\Seeder;

class TypePersonnelSeeder extends Seeder
{
    public function run(): void
    {
        $types = [
            ['code' => 200, 'laboral_relationship' => 'Personal Fijo', 'type_personal' => 'Administrativo', 'name' => 'Personal Administrativo No Descentralizado', 'source_budget' => 'Gobernación'],
            ['code' => 201, 'laboral_relationship' => 'Personal Fijo', 'type_personal' => 'Médico', 'name' => 'Personal Médico No Descentralizado', 'source_budget' => 'Gobernación'],
            ['code' => 202, 'laboral_relationship' => 'Personal Fijo', 'type_personal' => 'Obrero', 'name' => 'Personal Obrero No Descentralizado', 'source_budget' => 'Gobernación'],
            ['code' => 203, 'laboral_relationship' => 'Personal Fijo', 'type_personal' => 'Administrativo', 'name' => 'Personal Administrativo Descentralizado', 'source_budget' => 'MPPS – Falcón'],
            ['code' => 204, 'laboral_relationship' => 'Personal Fijo', 'type_personal' => 'Médico', 'name' => 'Personal Médico Descentralizado', 'source_budget' => 'MPPS – Falcón'],
            ['code' => 205, 'laboral_relationship' => 'Personal Fijo', 'type_personal' => 'Obrero', 'name' => 'Personal Obrero Descentralizado', 'source_budget' => 'MPPS – Falcón'],
            ['code' => 211, 'laboral_relationship' => 'Personal Fijo', 'type_personal' => 'Enfermera', 'name' => 'Personal Enfermera No Descentralizado', 'source_budget' => 'Gobernación'],
            ['code' => 212, 'laboral_relationship' => 'Personal Contratado', 'type_personal' => 'Enfermera', 'name' => 'Personal Contratado Enfermera No Descentralizado', 'source_budget' => 'Gobernación'],
            ['code' => 213, 'laboral_relationship' => 'Personal Fijo', 'type_personal' => 'Enfermera', 'name' => 'Personal Enfermera Descentralizado', 'source_budget' => 'MPPS – Falcón'],
            ['code' => 214, 'laboral_relationship' => 'Personal Contratado', 'type_personal' => 'Enfermera', 'name' => 'Personal Contratado Enfermera Descentralizado', 'source_budget' => 'MPPS – Falcón'],
            ['code' => 230, 'laboral_relationship' => 'Jubilado', 'type_personal' => 'Administrativo', 'name' => 'Personal Administrativo Jubilados Descentralizados', 'source_budget' => 'MPPS – Falcón'],
            ['code' => 231, 'laboral_relationship' => 'Pensionado', 'type_personal' => 'Administrativo', 'name' => 'Personal Administrativo Pensionado Descentralizados', 'source_budget' => 'MPPS – Falcón'],
            ['code' => 233, 'laboral_relationship' => 'Jubilado', 'type_personal' => 'Médico', 'name' => 'Personal Médico Jubilado Descentralizados', 'source_budget' => 'MPPS – Falcón'],
            ['code' => 234, 'laboral_relationship' => 'Jubilado', 'type_personal' => 'Obrero', 'name' => 'Personal Obrero Jubilados No Descentralizados', 'source_budget' => 'Gobernación'],
            ['code' => 235, 'laboral_relationship' => 'Pensionado', 'type_personal' => 'Obrero', 'name' => 'Personal Obrero Pensionados No Descentralizados', 'source_budget' => 'Gobernación'],
            ['code' => 236, 'laboral_relationship' => 'Jubilado', 'type_personal' => 'Administrativo', 'name' => 'Personal Administrativo Jubilados No Descentralizados', 'source_budget' => 'Gobernación'],
            ['code' => 237, 'laboral_relationship' => 'Pensionado', 'type_personal' => 'Administrativo', 'name' => 'Personal Administrativo Pensionado No Descentralizados', 'source_budget' => 'Gobernación'],
            ['code' => 238, 'laboral_relationship' => 'Jubilado', 'type_personal' => 'Obrero', 'name' => 'Personal Obrero Jubilados Descentralizados', 'source_budget' => 'MPPS – Falcón'],
            ['code' => 239, 'laboral_relationship' => 'Pensionado', 'type_personal' => 'Obrero', 'name' => 'Personal Obrero Pensionados Descentralizados', 'source_budget' => 'MPPS – Falcón'],
            ['code' => 240, 'laboral_relationship' => 'Personal Contratado', 'type_personal' => 'Administrativo', 'name' => 'Personal Contratado Administrativo No Descentralizado', 'source_budget' => 'Gobernación'],
            ['code' => 241, 'laboral_relationship' => 'Personal Contratado', 'type_personal' => 'Médico', 'name' => 'Personal Contratado Médico No Descentralizado', 'source_budget' => 'Gobernación'],
            ['code' => 242, 'laboral_relationship' => 'Personal Contratado', 'type_personal' => 'Obrero', 'name' => 'Personal Contratado Obrero No Descentralizado', 'source_budget' => 'Gobernación'],
            ['code' => 244, 'laboral_relationship' => 'Personal Contratado', 'type_personal' => 'Administrativo', 'name' => 'Personal Contratado Administrativo Descentralizado', 'source_budget' => 'MPPS – Falcón'],
            ['code' => 245, 'laboral_relationship' => 'Personal Contratado', 'type_personal' => 'Médico', 'name' => 'Personal Contratado Médico Descentralizado', 'source_budget' => 'MPPS – Falcón'],
            ['code' => 246, 'laboral_relationship' => 'Personal Contratado', 'type_personal' => 'Obrero', 'name' => 'Personal Contratado Obrero Descentralizado', 'source_budget' => 'MPPS – Falcón'],
            ['code' => 257, 'laboral_relationship' => 'Sobreviviente', 'type_personal' => 'Sobreviviente', 'name' => 'Pensionados Sobrevivientes No Descentralizados', 'source_budget' => 'Gobernación'],
            ['code' => 258, 'laboral_relationship' => 'Sobreviviente', 'type_personal' => 'Sobreviviente', 'name' => 'Pensionados Sobrevivientes Descentralizados', 'source_budget' => 'MPPS – Falcón'],
            ['code' => 259, 'laboral_relationship' => 'Jubilado', 'type_personal' => 'Empleado', 'name' => 'Jubilados Empleados Descentralizados', 'source_budget' => 'MPPS – Falcón'],
            ['code' => 260, 'laboral_relationship' => 'Jubilado', 'type_personal' => 'Obrero', 'name' => 'Jubilados Obreros Descentralizados', 'source_budget' => 'MPPS – Falcón'],
            ['code' => 261, 'laboral_relationship' => 'Pensionado', 'type_personal' => 'Empleado', 'name' => 'Pensionados Empleados Por Incapacidad Descentralizados', 'source_budget' => 'MPPS – Falcón'],
            ['code' => 262, 'laboral_relationship' => 'Pensionado', 'type_personal' => 'Obrero', 'name' => 'Pensionados Obreros Por Incapacidad Descentralizados', 'source_budget' => 'MPPS – Falcón'],
        ];

        foreach ($types as $type) {
            TypePersonnel::create($type);
        }
    }
}
