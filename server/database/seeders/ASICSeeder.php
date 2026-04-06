<?php

namespace Database\Seeders;

use App\Models\ASIC;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class ASICSeeder extends Seeder
{
    public function run(): void
    {
        $asics = [
            'ASIC CARLINA LUCHON',
            'ASIC SECUNDINO URBINA',
            'ASIC ERNESTO CHE GUEVARA',
            'ASIC LUIS ALEXIS ZAMARRIPA',
            'ASIC PEDRO DE ARMAS',
            'ASIC MARINO COLINA',
            'ASIC LUIS MANUEL PIÑA',
            'ASIC GENERALISIMO FRANCISCO DE MIRANDA',
            'ASIC HEROINA JOSEFA CAMEJO',
            'ASIC ADOLFO MARTINEZ GUZMAN',
            'ASIC RAUL GONZALEZ CASTRO',
            'ASIC RAMON JATEM REYES',
            'ASIC DOÑA INES DE ZAVALA DE REYES',
            'ASIC ALIRIO NAVARRO ALEMAN',
            'ASIC DR ADALBERTO REDONDO',
            'ASIC PRESBITERO FABIAN CHELALA',
            'ASIC MODESTO HACKEL',
            'ASIC DR JESUS HIGUERA',
            'ASIC PEDRO MEDINA FIGUET',
            'ASIC ALI PRIMERA',
            'ASIC ALBERTO BETO ZAMORA',
            'ASIC IGNACIO BRAVO PETIT',
        ];

        foreach ($asics as $name) {
            ASIC::create(['name' => $name]);
        }
    }
}
