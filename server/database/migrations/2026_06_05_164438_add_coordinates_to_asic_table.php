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
        Schema::table('asics', function (Blueprint $table) {
            $table->string('coordinates')->nullable()->after('sync_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('asics', function (Blueprint $table) {
            $table->dropColumn('coordinates');
        });
    }
};
