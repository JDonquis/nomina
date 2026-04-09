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
        Schema::create('type_personnels', function (Blueprint $table) {
            $table->id();
            $table->integer('code')->unique();
            $table->string('laboral_relationship')->nullable();
            $table->string('type_personal')->nullable();
            $table->string('name')->nullable();
            $table->string('source_budget')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('type_personnels');
    }
};
