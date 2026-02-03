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
            $table->string('city')->nullable()->default('Sin asignar');
            $table->string('state')->default('Falcon');
            $table->foreignId('administrative_location_id')->nullable();
            $table->string('phone_number')->nullable();
            $table->string('photo')->nullable();
            //Pension Data
            $table->enum('type_pension', ['Jubilacion', 'Incapacidad', 'Sobrevivencia']);
            $table->foreignId('type_pay_sheet_id');
            $table->string('last_charge')->nullable();
            $table->enum('civil_status', ['S', 'C', 'V']);
            $table->integer('minor_child_nro')->default(0);
            $table->integer('disabled_child_nro')->default(0);
            $table->boolean('receive_pension_from_another_organization_status')->default(false);
            $table->string('another_organization_name')->nullable();
            $table->boolean('has_authorizations')->default(false);
            // Pension Survivor
            $table->boolean('pension_survivor_status')->default(false);
            $table->string('fullname_causative')->nullable();
            $table->integer('age_causative')->nullable();
            $table->enum('parent_causative', ['Padre', 'Madre', 'Conyuge', 'Concubino'])->nullable();
            $table->enum('sex_causative', ['M', 'F'])->nullable();
            $table->string('ci_causative')->nullable();
            $table->date('decease_date')->nullable();
            $table->boolean('suspend_payment_status')->default(false);
            $table->date('last_payment')->nullable();
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
