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
        Schema::table('censuses', function (Blueprint $table) {
            $table->foreignId('pay_sheet_id')->nullable()->change();
            $table->foreignId('active_personnel_id')->nullable()->after('pay_sheet_id')->constrained('active_personnels');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('censuses', function (Blueprint $table) {
            $table->dropForeign(['active_personnel_id']);
            $table->dropColumn('active_personnel_id');
            $table->foreignId('pay_sheet_id')->nullable(false)->change();
        });
    }
};
