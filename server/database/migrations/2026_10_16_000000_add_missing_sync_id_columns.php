<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    private array $tables = [
        'active_personnels',
        'family_members',
        'censuses',
        'pay_sheets',
        'activities',
    ];

    public function up(): void
    {
        foreach ($this->tables as $table) {
            if (Schema::hasTable($table) && !Schema::hasColumn($table, 'sync_id')) {
                Schema::table($table, function (Blueprint $blueprint) {
                    $blueprint->uuid('sync_id')->unique()->nullable()->after('id');
                });
            }
        }
    }

    public function down(): void
    {
        foreach ($this->tables as $table) {
            if (Schema::hasTable($table) && Schema::hasColumn($table, 'sync_id')) {
                Schema::table($table, function (Blueprint $blueprint) {
                    $blueprint->dropColumn('sync_id');
                });
            }
        }
    }
};
