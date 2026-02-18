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
        // Schema::table('pay_sheets', function (Blueprint $table) {
        //     $table->foreignId('latest_census_id')->nullable()->constrained('censuses')->nullOnDelete();
        // });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Schema::table('pay_sheets', function (Blueprint $table) {
        //     $table->dropForeign(['latest_census_id']);
        //     $table->dropColumn('latest_census_id');
        // });
    }
};
