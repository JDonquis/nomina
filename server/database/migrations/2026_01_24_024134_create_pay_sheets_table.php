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
        Schema::create('pay_sheets', function (Blueprint $table) {
            $table->id();
            $table->string('ci');
            $table->string('full_name');
            $table->string('date_birth');
            $table->string('sex');
            $table->foreignId('type_pay_sheet_id');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('pay_sheets');
    }
};
