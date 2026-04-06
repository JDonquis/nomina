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
            'ASIC Adolfo Martinez Guzman',
            'ASIC Alberto Beto Zamora',
            'ASIC Ali Primera',
            'ASIC Alirio Navarro Aleman',
            'ASIC Carlina Luchon',
            'ASIC Doña Ines De Zavala De Reyes',
            'ASIC Dr Adalberto Redondo',
            'ASIC Dr Jesus Higuera',
            'ASIC Ernesto Che Guevara',
            'ASIC Generalisimo Francisco De Miranda',
            'ASIC Heroina Josefa Camejo',
            'ASIC Ignacio Bravo Petit',
            'ASIC Luis Alexis Zamarripa',
            'ASIC Luis Manuel Piña',
            'ASIC Marino Colina',
            'ASIC Modesto Hackel',
            'ASIC Pedro de Armas',
            'ASIC Pedro Medina Figuet',
            'ASIC Presbitero Fabian Chelala',
            'ASIC Ramon Jatem Reyes',
            'ASIC Raul Gonzalez Castro',
            'ASIC Secundino Urbina',
        ];

        foreach ($asics as $name) {
            ASIC::create(['name' => $name]);
        }
    }
}
