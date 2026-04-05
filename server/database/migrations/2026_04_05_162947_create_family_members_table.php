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
        Schema::create('family_members', function (Blueprint $table) {
            $table->id();
            $table->foreignId('active_personnel_id')->constrained('active_personnels')->onDelete('cascade');
            $table->string('ci')->nullable();
            $table->string('full_name');
            $table->date('date_birth')->nullable();
            $table->enum('sex', ['M', 'F', 'Sin asignar'])->default('Sin asignar');
            $table->string('relationship')->nullable(); // PARENTESCO
            $table->string('study_level')->nullable(); // NIVEL DE ESTUDIO
            $table->string('current_grade')->nullable(); // GRADO_CURSANTE
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('family_members');
    }
};
