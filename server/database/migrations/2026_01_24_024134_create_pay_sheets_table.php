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
        $table->string('email')->nullable();
        $table->string('phone_number')->nullable();
        $table->string('address')->nullable();
        $table->enum('municipality', [
            'Acosta',
            'Bolívar',
            'Buchivacoa',
            'Cacique Manaure',
            'Carirubana',
            'Colina',
            'Dabajuro',
            'Democracia',
            'Falcón',
            'Federación',
            'Jacura',
            'José Laurencio Silva',
            'Los Taques',
            'Mauroa',
            'Miranda',
            'Monseñor Iturriza',
            'Palmasola',
            'Petit',
            'Píritu',
            'San Francisco',
            'Sucre',
            'Tocópero',
            'Unión',
            'Urumaco',
            'Zamora']);
        $table->enum('parish', [
            // Municipio Acosta
            'Capadare',
            'La Pastora',
            'Libertador',
            'San Juan de los Cayos',
            // Municipio Bolívar
            'Aracua',
            'La Peña',
            'San Luis',
            // Municipio Buchivacoa
            'Bariro',
            'Borojó',
            'Capatárida',
            'Guajiro',
            'Seque',
            'Valle de Eroa',
            'Zazárida Buchivacoa',
            // Municipio Cacique Manaure
            'Cacique Manaure',
            // Municipio Carirubana
            'Norte',
            'Carirubana',
            'Santa Ana (Carirubana)',
            'Urbana Punta Cardón',
            // Municipio Colina
            'La Vela de Coro',
            'Acurigua',
            'Guaibacoa',
            'Las Calderas',
            'Mataruca',
            // Municipio Dabajuro
            'Dabajuro',
            // Municipio Democracia
            'Agua Clara',
            'Avaria',
            'Pedregal',
            'Piedra Grande',
            'Purureche',
            // Municipio Falcón
            'Adaure',
            'Adícora',
            'Baraived',
            'Buena Vista',
            'Jadacaquiva',
            'El Vínculo',
            'El Hato',
            'Moruy',
            'Pueblo Nuevo',
            // Municipio Federación
            'Agua Larga',
            'Churuguara',
            'El Paují',
            'Independencia',
            'Mapararí',
            // Municipio Jacura
            'Agua Linda',
            'Araurima',
            'Jacura',
            // Municipio José Laurencio Silva
            'Tucacas',
            'Boca de Aroa',
            // Municipio Los Taques
            'Los Taques',
            'Judibana',
            // Municipio Mauroa
            'Mene de Mauroa',
            'San Félix',
            'Casigua',
            // Municipio Miranda
            'Guzmán Guillermo',
            'Mitare',
            'Río Seco',
            'Sabaneta',
            'San Antonio',
            'San Gabriel',
            'Santa Ana',
            // Municipio Monseñor Iturriza
            'Boca del Tocuyo',
            'Chichiriviche',
            'Tocuyo de la Costa',
            // Municipio Palmasola
            'Palmasola',
            // Municipio Petit
            'Cabure',
            'Colina',
            'Curimagua',
            // Municipio Píritu
            'San José de la Costa',
            'Píritu',
            // Municipio San Francisco
            'Mirimire',
            // Municipio Sucre
            'Sucre',
            'Pecaya',
            // Municipio Tocópero
            'Tocópero',
            // Municipio Unión
            'El Charal',
            'Las Vegas del Tuy',
            'Santa Cruz de Bucaral',
            // Municipio Urumaco
            'Bruzual',
            'Urumaco',
            // Municipio Zamora
            'Puerto Cumarebo',
            'La Ciénaga',
            'La Soledad',
            'Pueblo Cumarebo',
            'Zazárida Buchivacoa Zamora']);
        $table->string('state')->default('Falcon');
        $table->string('city')->nullable()->default('Sin asignar');
        $table->string('full_name');
        $table->string('date_birth')->nullable();
        $table->string('sex')->nullable()->default('Sin asignar');
        $table->foreignId('type_pay_sheet_id')->nullable();
        $table->foreignId('administrative_location_id')->nullable();
        $table->string('photo')->nullable();

        // Pension Data
        $table->enum('type_pension', ['Jubilacion', 'Incapacidad', 'Sobrevivencia', 'Pensionado', 'Jubilado y sobreviviente']);
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

        $table->foreignId('user_id')->nullable();
        $table->boolean('status')->default(false);


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
