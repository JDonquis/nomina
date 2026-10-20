<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::transaction(function () {
            $medical = DB::table('type_personnels')
                ->where('code', 245)
                ->where('type_personal', 'Médico')
                ->first();

            $worker = DB::table('type_personnels')
                ->where('code', 246)
                ->where('type_personal', 'Obrero')
                ->first();

            if (!$medical || !$worker) {
                return;
            }

            DB::table('type_personnels')
                ->where('id', $medical->id)
                ->update(['code' => 999245, 'updated_at' => now()]);

            DB::table('type_personnels')
                ->where('id', $worker->id)
                ->update(['code' => 245, 'updated_at' => now()]);

            DB::table('type_personnels')
                ->where('id', $medical->id)
                ->update(['code' => 246, 'updated_at' => now()]);
        });
    }

    public function down(): void
    {
        DB::transaction(function () {
            $medical = DB::table('type_personnels')
                ->where('code', 246)
                ->where('type_personal', 'Médico')
                ->first();

            $worker = DB::table('type_personnels')
                ->where('code', 245)
                ->where('type_personal', 'Obrero')
                ->first();

            if (!$medical || !$worker) {
                return;
            }

            DB::table('type_personnels')
                ->where('id', $medical->id)
                ->update(['code' => 999246, 'updated_at' => now()]);

            DB::table('type_personnels')
                ->where('id', $worker->id)
                ->update(['code' => 246, 'updated_at' => now()]);

            DB::table('type_personnels')
                ->where('id', $medical->id)
                ->update(['code' => 245, 'updated_at' => now()]);
        });
    }
};
