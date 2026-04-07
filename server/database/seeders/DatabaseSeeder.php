<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\ASIC;
use App\Models\AdministrativeLocation;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // $this->call([
        //     UserSeeder::class,
        //     TypePaySheetSeeder::class,
        //     ASICSeeder::class,
        //     AdministrativeLocationSeeder::class,
        // ]);

        // Update specific ASICs to Title Case
        ASIC::where('name', 'ASIC LUIS MANUEL PIÑA')->update(['name' => 'ASIC Luis Manuel Piña']);
        ASIC::where('name', 'ASIC DOÑA INES DE ZAVALA DE REYES')->update(['name' => 'ASIC Doña Ines De Zavala De Reyes']);

        // AdministrativeLocation::create([
        //     'name' => 'EXTERIOR'
        // ]);
    }
}
