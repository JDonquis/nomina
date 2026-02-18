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
        Schema::create('censuses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('pay_sheet_id');
            $table->foreignId('user_id');
            $table->boolean('status')->default(false);
            $table->timestamp('expiration_date');
            $table->json('data');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('censuses');
    }
};
