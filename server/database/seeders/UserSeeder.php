<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        User::create([
            'full_name' => 'Testman',
            'charge' => 'Administrador',
            'password' => Hash::make('admin'),
            'email' => 'test@test.com',
            'is_admin' => true,
        ]);

        User::create([
            'full_name' => 'Chambeador',
            'charge' => 'Chambeador',
            'password' => Hash::make('admin'),
            'email' => 'test2@test.com',
            'is_admin' => false,
        ]);
    }
}
