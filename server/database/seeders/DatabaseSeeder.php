<?php

namespace Database\Seeders;

use App\Models\ASIC;
use App\Models\AuditLog;
use App\Models\PaySheet;
use App\Models\Personnel;
use App\Models\TypePersonnel;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    public function run(): void
    {

        $this->restartDatabase('10abril2026');

        $this->call([
            TypePersonnelSeeder::class,
        ]);


        $allPaySheets = PaySheet::get();

        foreach ($allPaySheets as $paySheet) {
            $typePersonnel = null;

            if ($paySheet->typePaySheet) {
                $typePersonnel = TypePersonnel::where('code', $paySheet->typePaySheet->code)->first();
            }

            $asic = null;
            if ($paySheet->administrative_location_id) {
                $asic = ASIC::find($paySheet->administrative_location_id);
            }

            $additionalData = [];

            if ($paySheet->type_pension) {
                $additionalData['type_pension'] = $paySheet->type_pension;
            }
            if ($paySheet->last_charge) {
                $additionalData['last_charge'] = $paySheet->last_charge;
            }
            if ($paySheet->minor_child_nro) {
                $additionalData['minor_child_nro'] = $paySheet->minor_child_nro;
            }
            if ($paySheet->disabled_child_nro) {
                $additionalData['disabled_child_nro'] = $paySheet->disabled_child_nro;
            }
            if ($paySheet->another_organization_name) {
                $additionalData['another_organization_name'] = $paySheet->another_organization_name;
            }
            if ($paySheet->fullname_causative) {
                $additionalData['fullname_causative'] = $paySheet->fullname_causative;
            }
            if ($paySheet->age_causative) {
                $additionalData['age_causative'] = $paySheet->age_causative;
            }
            if ($paySheet->parent_causative) {
                $additionalData['parent_causative'] = $paySheet->parent_causative;
            }
            if ($paySheet->sex_causative) {
                $additionalData['sex_causative'] = $paySheet->sex_causative;
            }
            if ($paySheet->ci_causative) {
                $additionalData['ci_causative'] = $paySheet->ci_causative;
            }
            if ($paySheet->decease_date) {
                $additionalData['decease_date'] = $paySheet->decease_date;
            }
            if ($paySheet->last_payment) {
                $additionalData['last_payment'] = $paySheet->last_payment;
            }
            if ($paySheet->user_id) {
                $additionalData['user_id'] = $paySheet->user_id;
            }

            $personnel = Personnel::create([
                'status' => 'inactive',
                'nac' => $paySheet->nac,
                'ci' => $paySheet->ci,
                'email' => $paySheet->email,
                'phone_number' => $paySheet->phone_number,
                'address' => $paySheet->address,
                'municipality' => $paySheet->municipality,
                'parish' => $paySheet->parish,
                'state' => $paySheet->state,
                'city' => $paySheet->city,
                'full_name' => $paySheet->full_name,
                'date_birth' => $paySheet->date_birth,
                'sex' => $paySheet->sex,
                'civil_status' => $paySheet->civil_status,
                'photo' => $paySheet->photo,
                'type_personnel_id' => $typePersonnel?->id,
                'asic_id' => $asic?->id,
                'receive_pension_from_another_organization_status' => $paySheet->receive_pension_from_another_organization_status,
                'has_authorizations' => $paySheet->has_authorizations,
                'pension_survivor_status' => $paySheet->pension_survivor_status,
                'suspend_payment_status' => $paySheet->suspend_payment_status,
                'additional_data' => !empty($additionalData) ? $additionalData : null,
                'census_status' => $paySheet->status
            ]);

            $action = 'create';

            if ($paySheet->status) {
                $action = 'create_and_census';
            }

            AuditLog::create([
                'action' => $action,
                'auditable_type' => Personnel::class,
                'auditable_id' => $personnel->id,
                'user_id' => $paySheet->user_id ?? 1,
                'old_values' => null,
                'new_values' => $personnel->toArray(),
            ]);
        }
    }

    private function restartDatabase($filename)
    {

        ini_set('memory_limit', '500M');

        DB::transaction(function () use ($filename) {
            try {

                Artisan::call('migrate:fresh');
                DB::unprepared(file_get_contents(database_path('sql/' . $filename . '.sql')));
            } catch (\Exception $e) {
                Log::info('UN ERROR EN EL REINICIO DE DB');
                Log::error($e->getMessage());
                throw $e;
            }
        });
    }
}
