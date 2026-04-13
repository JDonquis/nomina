<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        $tables = [
            'asics',
            'dependencies',
            'administrative_units',
            'departments',
            'services',
            'type_personnels',
            'type_pay_sheets',
            'administrative_locations',
            'personnels',
            'users',
        ];

        foreach ($tables as $table) {
            Schema::table($table, function (Blueprint $table) {
                $table->uuid('sync_id')->unique()->nullable()->after('id');
            });
        }
    }

    public function down(): void
    {
        $tables = [
            'asics',
            'dependencies',
            'administrative_units',
            'departments',
            'services',
            'type_personnels',
            'type_pay_sheets',
            'administrative_locations',
            'personnels',
            'users',
        ];

        foreach ($tables as $table) {
            Schema::table($table, function (Blueprint $table) {
                $table->dropColumn('sync_id');
            });
        }
    }
};
