<?php

namespace Database\Seeders;

use App\Models\TypePaySheet;
use Illuminate\Database\Seeder;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;

class TypePaySheetSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        TypePaySheet::create([
            'name' => "PERSONAL ADMINISTRATIVO JUBILADOS DESCENTRALIZADOS",
            'code' => 230,
            'type_personal' => 'ADMINISTRATIVO',

        ]);

        TypePaySheet::create([
            'name' => "PERSONAL ADMINISTRATIVO PENSIONADO DESCENTRALIZADOS",
            'code' => 231,
            'type_personal' => 'ADMINISTRATIVO',

        ]);

        TypePaySheet::create([
            'name' => "PERSONAL MEDICO JUBILADO DESCENTRALIZADOS",
            'code' => 233,
            'type_personal' => 'MEDICO',

        ]);

        TypePaySheet::create([
            'name' => "PERSONAL OBRERO JUBILADOS NO DESCENTRALIZADOS",
            'code' => 234,
            'type_personal' => 'OBRERO',

        ]);

        TypePaySheet::create([
            'name' => "PERSONAL OBRERO PENSIONADOS NO DESCENTRALIZADOS",
            'code' => 235,
            'type_personal' => 'OBRERO',

        ]);

        TypePaySheet::create([
            'name' => "PERSONAL ADMINISTRATIVO JUBILADOS NO DESCENTRALIZADOS",
            'code' => 236,
            'type_personal' => 'ADMINISTRATIVO',

        ]);

        TypePaySheet::create([
            'name' => "PERSONAL ADMINISTRATIVO PENSIONADO NO DESCENTRALIZADOS",
            'code' => 237,
            'type_personal' => 'ADMINISTRATIVO',

        ]);

        TypePaySheet::create([
            'name' => "PERSONAL OBRERO JUBILIDADOS DESCENTRALIZADOS",
            'code' => 238,
            'type_personal' => 'OBRERO',

        ]);

        TypePaySheet::create([
            'name' => "PERSONAL OBRERO PENSIONADOS DESCENTRALIZADOS",
            'code' => 239,
            'type_personal' => 'OBRERO',

        ]);

        TypePaySheet::create([
            'name' => "PENSIONADOS SOBREVIVIENTES DESCENTRALIZADOS",
            'code' => 257,
            'type_personal' => 'SOBREVIVIENTE',

        ]);

        TypePaySheet::create([
            'name' => "PENSIONADOS SOBREVIVIENTES NO DESCENTRALIZADOS",
            'code' => 258,
            'type_personal' => 'SOBREVIVIENTE',

        ]);
    }
}
