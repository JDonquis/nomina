<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sync_logs', function (Blueprint $table) {
            $table->id();
            $table->uuid('sync_id')->unique();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->enum('direction', ['export', 'import']);
            $table->enum('status', ['pending', 'completed', 'failed'])->default('pending');
            $table->string('file_hash')->nullable();
            $table->integer('records_exported')->default(0);
            $table->integer('records_imported')->default(0);
            $table->integer('conflicts_count')->default(0);
            $table->json('summary')->nullable();
            $table->timestamp('synced_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sync_logs');
    }
};
