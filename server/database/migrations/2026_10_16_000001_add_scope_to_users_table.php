<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->foreignId('asic_id')->nullable()->after('is_admin')->constrained('asics')->nullOnDelete();
            $table->foreignId('dependency_id')->nullable()->after('asic_id')->constrained('dependencies')->nullOnDelete();
            $table->foreignId('administrative_unit_id')->nullable()->after('dependency_id')->constrained('administrative_units')->nullOnDelete();
            $table->foreignId('department_id')->nullable()->after('administrative_unit_id')->constrained('departments')->nullOnDelete();
            $table->foreignId('service_id')->nullable()->after('department_id')->constrained('services')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropConstrainedForeignId('asic_id');
            $table->dropConstrainedForeignId('dependency_id');
            $table->dropConstrainedForeignId('administrative_unit_id');
            $table->dropConstrainedForeignId('department_id');
            $table->dropConstrainedForeignId('service_id');
        });
    }
};
