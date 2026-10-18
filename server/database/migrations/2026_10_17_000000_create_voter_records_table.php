<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('voter_records', function (Blueprint $table) {
            $table->id();
            $table->string('ci')->unique();
            $table->string('full_name')->nullable();
            $table->foreignId('personnel_id')
                ->nullable()
                ->constrained('personnels')
                ->nullOnDelete();
            $table->enum('center_type', ['asic', 'hospital', 'health_secretariat']);
            $table->foreignId('asic_id')->nullable()->constrained('asics')->nullOnDelete();
            $table->foreignId('dependency_id')->nullable()->constrained('dependencies')->nullOnDelete();
            $table->string('center_name');
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('voted_at');
            $table->timestamps();

            $table->index('center_type');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('voter_records');
    }
};
