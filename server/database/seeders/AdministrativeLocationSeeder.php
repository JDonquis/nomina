<?php

namespace Database\Seeders;

use App\Models\AdministrativeLocation;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class AdministrativeLocationSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        AdministrativeLocation::create([
            'name' => 'ASIC CARLINA LUCHON'
        ]);

        AdministrativeLocation::create([
            'name' => 'ASIC SECUNDINO URBINA'
        ]);

        AdministrativeLocation::create([
            'name' => 'ASIC ERNESTO CHE GUEVARA'
        ]);

        AdministrativeLocation::create([
            'name' => 'ASIC LUIS ALEXIS ZAMARRIPA'
        ]);

        AdministrativeLocation::create([
            'name' => 'ASIC PEDRO DE ARMAS'
        ]);

        AdministrativeLocation::create([
            'name' => 'ASIC MARINO COLINA'
        ]);

        AdministrativeLocation::create([
            'name' => 'ASIC LUIS MANUEL PIÑA'
        ]);

        AdministrativeLocation::create([
            'name' => 'ASIC GENERALISIMO FRANCISCO DE MIRANDA'
        ]);

        AdministrativeLocation::create([
            'name' => 'ASIC HEROINA JOSEFA CAMEJO'
        ]);

        AdministrativeLocation::create([
            'name' => 'ASIC ADOLFO MARTINEZ GUZMAN'
        ]);

        AdministrativeLocation::create([
            'name' => 'ASIC RAUL GONZALEZ CASTRO'
        ]);

        AdministrativeLocation::create([
            'name' => 'ASIC RAMON JATEM REYES'
        ]);

        AdministrativeLocation::create([
            'name' => 'ASIC DOÑA INES DE ZAVALA DE REYES'
        ]);

        AdministrativeLocation::create([
            'name' => 'ASIC ALIRIO NAVARRO ALEMAN'
        ]);

        AdministrativeLocation::create([
            'name' => 'ASIC DR ADALBERTO REDONDO'
        ]);

        AdministrativeLocation::create([
            'name' => 'ASIC PRESBITERO FABIAN CHELALA'
        ]);

        AdministrativeLocation::create([
            'name' => 'ASIC MODESTO HACKEL'
        ]);

        AdministrativeLocation::create([
            'name' => 'ASIC DR JESUS HIGUERA'
        ]);

        AdministrativeLocation::create([
            'name' => 'ASIC PEDRO MEDINA FIGUET'
        ]);

        AdministrativeLocation::create([
            'name' => 'ASIC ALI PRIMERA'
        ]);

        AdministrativeLocation::create([
            'name' => 'ASIC ALBERTO BETO ZAMORA'
        ]);

        AdministrativeLocation::create([
            'name' => 'ASIC IGNACIO BRAVO PETIT'
        ]);
    }
}
