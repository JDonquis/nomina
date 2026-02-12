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
            // Personal Data
            $table->id();
            $table->enum('nac', ['V', 'E']);
            $table->string('ci');
            $table->string('full_name');
            $table->string('date_birth')->nullable();
            $table->string('sex')->nullable()->default('Sin asignar');
            $table->foreignId('type_pay_sheet_id');
            $table->string('photo')->nullable();
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
