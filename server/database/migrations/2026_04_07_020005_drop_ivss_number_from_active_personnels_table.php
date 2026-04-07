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
        Schema::table('active_personnels', function (Blueprint $table) {
            $table->dropColumn('ivss_number');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('active_personnels', function (Blueprint $table) {
            $table->string('ivss_number')->nullable();
        });
    }
};
