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
            $table->enum('municipalitiy', [
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
                'Zamora'
            ]);
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
            'Santa Ana Carirubana',
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
            'Santa Ana Miranda',
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
            'Zazárida Buchivacoa Zamora'
        ]);
            $table->string('full_name');
            $table->string('date_birth')->nullable();
            $table->string('sex')->nullable()->default('Sin asignar');
            $table->foreignId('type_pay_sheet_id')->nullable();
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
