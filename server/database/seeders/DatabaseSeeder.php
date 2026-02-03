<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\AdministrativeLocation;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        AdministrativeLocation::create([
            'name' => 'Hospital de Carabobo',
        ]);

        $this->call([
            UserSeeder::class,
            TypePaySheetSeeder::class,
            AdministrativeLocationSeeder::class
        ]);
    }
}
