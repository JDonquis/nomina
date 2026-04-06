<?php

namespace Database\Seeders;

use App\Models\ASIC;
use Illuminate\Database\Seeder;

class ASICSeeder extends Seeder
{
    public function run(): void
    {
        $asics = [
            'ASIC Carlina Luchon',
            'ASIC Secundino Urbina',
            'ASIC Ernesto Che Guevara',
            'ASIC Luis Alexis Zamarripa',
            'ASIC Pedro De Armas',
            'ASIC Marino Colina',
            'ASIC Luis Manuel Piña',
            'ASIC Generalisimo Francisco De Miranda',
            'ASIC Heroina Josefa Camejo',
            'ASIC Adolfo Martinez Guzman',
            'ASIC Raul Gonzalez Castro',
            'ASIC Ramon Jatem Reyes',
            'ASIC Doña Ines De Zavala De Reyes',
            'ASIC Alirio Navarro Aleman',
            'ASIC Dr Adalberto Redondo',
            'ASIC Presbitero Fabian Chelala',
            'ASIC Modesto Hackel',
            'ASIC Dr Jesus Higuera',
            'ASIC Pedro Medina Figuet',
            'ASIC Ali Primera',
            'ASIC Alberto Beto Zamora',
            'ASIC Ignacio Bravo Petit',
        ];

        foreach ($asics as $name) {
            ASIC::create(['name' => $name]);
        }
    }
}
