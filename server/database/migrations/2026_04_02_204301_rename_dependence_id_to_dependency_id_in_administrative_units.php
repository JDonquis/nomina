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
        Schema::table('administrative_units', function (Blueprint $table) {
            $table->renameColumn('dependence_id', 'dependency_id');
        });
    }

    public function down(): void
    {
        Schema::table('administrative_units', function (Blueprint $table) {
            $table->renameColumn('dependency_id', 'dependence_id');
        });
    }
};
