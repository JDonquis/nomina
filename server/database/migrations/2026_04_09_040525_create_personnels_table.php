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
        Schema::create('personnels', function (Blueprint $table) {
            $table->id();
            $table->enum('status', ['active', 'inactive'])->default('active');
            $table->boolean('census_status')->default(false);
            $table->foreignId('type_personnel_id')->constrained('type_personnels')->onDelete('cascade');
            $table->enum('nac', ['V', 'E']);
            $table->string('ci');
            $table->string('full_name');
            $table->string('date_birth')->nullable();
            $table->string('sex')->nullable()->default('Sin asignar');
            $table->string('civil_status')->nullable()->default('Sin asignar');
            $table->string('phone_number')->nullable();
            $table->string('email')->nullable();
            $table->string('address')->nullable();
            $table->string('municipality')->nullable();
            $table->string('parish')->nullable();
            $table->string('state')->default('Falcon');
            $table->string('city')->nullable()->default('Sin asignar');
            $table->string('photo')->nullable();
            $table->foreignId('asic_id')->nullable();
            $table->foreignId('dependency_id')->nullable();
            $table->foreignId('administrative_unit_id')->nullable();
            $table->foreignId('department_id')->nullable();
            $table->foreignId('service_id')->nullable();
            $table->boolean('receive_pension_from_another_organization_status')->default(false);
            $table->boolean('has_authorizations')->default(false);
            $table->boolean('pension_survivor_status')->default(false);
            $table->boolean('suspend_payment_status')->default(false);
            $table->boolean('is_resident')->default(false); // RESIDENTE
            $table->json('additional_data')->nullable();

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('personnels');
    }
};
