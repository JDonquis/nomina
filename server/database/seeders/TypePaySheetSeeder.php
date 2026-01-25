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
        ]);

        TypePaySheet::create([
            'name' => "PERSONAL ADMINISTRATIVO PENSIONADO DESCENTRALIZADOS",
            'code' => 231,
        ]);

        TypePaySheet::create([
            'name' => "PERSONAL MEDICO JUBILADO DESCENTRALIZADOS",
            'code' => 233,
        ]);

        TypePaySheet::create([
            'name' => "PERSONAL OBRERO JUBILADOS NO DESCENTRALIZADOS",
            'code' => 234,
        ]);

        TypePaySheet::create([
            'name' => "PERSONAL OBRERO PENSIONADOS NO DESCENTRALIZADOS",
            'code' => 235,
        ]);

        TypePaySheet::create([
            'name' => "PERSONAL ADMINISTRATIVO JUBILADOS NO DESCENTRALIZADOS",
            'code' => 236,
        ]);

        TypePaySheet::create([
            'name' => "PERSONAL ADMINISTRATIVO PENSIONADO NO DESCENTRALIZADOS",
            'code' => 237,
        ]);

        TypePaySheet::create([
            'name' => "PERSONAL OBRERO JUBILIDADOS DESCENTRALIZADOS",
            'code' => 238,
        ]);

        TypePaySheet::create([
            'name' => "PERSONAL OBRERO PENSIONADOS DESCENTRALIZADOS",
            'code' => 239,
        ]);

        TypePaySheet::create([
            'name' => "PENSIONADOS SOBREVIVIENTES DESCENTRALIZADOS",
            'code' => 257,
        ]);
    }
}
