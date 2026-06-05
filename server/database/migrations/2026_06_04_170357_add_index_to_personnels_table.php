<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('personnels', function (Blueprint $table) {
            $table->index(['dependency_id', 'status', 'census_status'], 'personnels_active_census__dependency_idx');
            $table->index(['administrative_unit_id', 'status', 'census_status'], 'personnels_active_census__administrative_unit_idx');
            $table->index(['department_id', 'status', 'census_status'], 'personnels_active_census__department_idx');
            $table->index(['service_id', 'status', 'census_status'], 'personnels_active_census__service_idx');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('personnels', function (Blueprint $table) {
            $table->dropIndex('personnels_active_census__dependency_idx');
            $table->dropIndex('personnels_active_census__administrative_unit_idx');
            $table->dropIndex('personnels_active_census__department_idx');
            $table->dropIndex('personnels_active_census__service_idx');
        });
    }
};
