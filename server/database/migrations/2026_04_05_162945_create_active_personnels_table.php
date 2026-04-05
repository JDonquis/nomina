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
        Schema::create('active_personnels', function (Blueprint $table) {
            $table->id();
            $table->enum('nac', ['V', 'E']);
            $table->string('ci')->unique();
            $table->string('full_name');
            $table->date('date_birth')->nullable();
            $table->enum('sex', ['M', 'F', 'Sin asignar'])->default('Sin asignar');
            $table->enum('civil_status', ['S', 'C', 'V', 'D'])->nullable();
            $table->string('degree_obtained')->nullable();
            $table->string('postgraduate_degree')->nullable();
            $table->text('home_address')->nullable();
            $table->string('email')->nullable();
            $table->string('mobile_phone')->nullable();
            $table->string('fixed_phone')->nullable();
            $table->string('shirt_size')->nullable();
            $table->string('pant_size')->nullable();
            $table->string('shoe_size')->nullable();
            $table->string('photo')->nullable();
            $table->string('id_card_photo')->nullable(); // CARNET

            // Administrative Data
            $table->string('payroll_dependency')->nullable(); // DEPENDENCIA_NOMINA
            $table->foreignId('asic_id')->nullable();
            $table->foreignId('dependency_id')->nullable();
            $table->foreignId('administrative_unit_id')->nullable();
            $table->foreignId('department_id')->nullable();
            $table->foreignId('service_id')->nullable();
            
            $table->string('payroll_code')->nullable(); // COD_NOMINA
            $table->string('payroll_name')->nullable(); // NOMBRE_NOMINA
            $table->date('entry_date')->nullable(); // FECHA_INGRESO
            $table->string('job_title')->nullable(); // CARGO
            $table->boolean('is_resident')->default(false); // RESIDENTE
            $table->string('level')->nullable(); // NIVEL
            $table->string('university')->nullable(); // UNIVERSIDAD
            $table->string('position_code')->nullable(); // CODIGO_PUESTO
            $table->string('shift')->nullable(); // TURNO
            $table->string('bank_account_number')->nullable(); // Nº_CUENTA_BANCO
            $table->string('job_code')->nullable(); // CODIGO_CARGO
            $table->text('observation')->nullable(); // OBSERVACION
            $table->string('personnel_type')->nullable(); // TIPO_PERSONAL
            $table->string('budget')->nullable(); // PRESUPUESTO
            $table->string('labor_relationship')->nullable(); // RELACION LABORAL
            $table->string('grade')->nullable(); // GRADO
            $table->string('ivss_number')->nullable(); // IVSS

            $table->foreignId('user_id')->nullable();
            $table->foreignId('latest_census_id')->nullable();
            $table->boolean('status')->default(true);
            
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('active_personnels');
    }
};
