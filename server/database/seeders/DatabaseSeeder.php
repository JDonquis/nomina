<?php
namespace Database\Seeders;
// ini_set('memory_limit', '1024M');

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

        // TypePersonnel::create([
        //     'code' => 30,
        //     'laboral_relationship' => 'Emolumentos',
        //     'type_personal' => 'Sigedole',
        //     'name' => 'Sigedole',
        //     'source_budget' => 'Mpps'
        // ]);

        // TypePersonnel::create([
        //     'code' => 210,
        //     'laboral_relationship' => 'Alto Nivel y Dirección',
        //     'type_personal' => 'Comisión De Servicio',
        //     'name' => 'Personal En Comisión De Servicio Por Encargaduria',
        //     'source_budget' => 'Mpps - Falcón '
        // ]);


        // TypePersonnel::create([
        //     'code' => 208,
        //     'laboral_relationship' => 'Alto Nivel y Dirección',
        //     'type_personal' => 'Personal Directivo',
        //     'name' => 'Personal Directivo Gerencia Ejecutiva',
        //     'source_budget' => 'Gobernación'
        // ]);

        // TypePersonnel::create([
        //     'code' => 8,
        //     'laboral_relationship' => 'Empleados Contratados',
        //     'type_personal' => 'Sigedole',
        //     'name' => 'Sigedole',
        //     'source_budget' => 'Mpps'
        // ]);




        // $this->restartDatabase('22abril2026');

        // $this->call([
        //     TypePersonnelSeeder::class,
        // ]);

        // Personnel::truncate();
        // AuditLog::truncate();

        // $allPaySheets = PaySheet::get();

        // foreach ($allPaySheets as $paySheet) {
        //     $paySheetCreatedAt = $paySheet->created_at;

        //     $typePersonnel = null;

        //     if ($paySheet->typePaySheet) {
        //         $typePersonnel = TypePersonnel::where('code', $paySheet->typePaySheet->code)->first();
        //     }

        //     $asic = null;
        //     if ($paySheet->administrative_location_id) {
        //         $asic = ASIC::find($paySheet->administrative_location_id);
        //     }

        //     $additionalData = [];

        //     if ($paySheet->type_pension) {
        //         $additionalData['type_pension'] = $paySheet->type_pension;
        //     }
        //     if ($paySheet->last_charge) {
        //         $additionalData['last_charge'] = $paySheet->last_charge;
        //     }
        //     if ($paySheet->minor_child_nro) {
        //         $additionalData['minor_child_nro'] = $paySheet->minor_child_nro;
        //     }
        //     if ($paySheet->disabled_child_nro) {
        //         $additionalData['disabled_child_nro'] = $paySheet->disabled_child_nro;
        //     }
        //     if ($paySheet->another_organization_name) {
        //         $additionalData['another_organization_name'] = $paySheet->another_organization_name;
        //     }
        //     if ($paySheet->fullname_causative) {
        //         $additionalData['fullname_causative'] = $paySheet->fullname_causative;
        //     }
        //     if ($paySheet->age_causative) {
        //         $additionalData['age_causative'] = $paySheet->age_causative;
        //     }
        //     if ($paySheet->parent_causative) {
        //         $additionalData['parent_causative'] = $paySheet->parent_causative;
        //     }
        //     if ($paySheet->sex_causative) {
        //         $additionalData['sex_causative'] = $paySheet->sex_causative;
        //     }
        //     if ($paySheet->ci_causative) {
        //         $additionalData['ci_causative'] = $paySheet->ci_causative;
        //     }
        //     if ($paySheet->decease_date) {
        //         $additionalData['decease_date'] = $paySheet->decease_date;
        //     }
        //     if ($paySheet->last_payment) {
        //         $additionalData['last_payment'] = $paySheet->last_payment;
        //     }
        //     if ($paySheet->user_id) {
        //         $additionalData['user_id'] = $paySheet->user_id;
        //     }

        //     $personnel = Personnel::create([
        //         'status' => 'inactive',
        //         'nac' => $paySheet->nac,
        //         'ci' => $paySheet->ci,
        //         'email' => $paySheet->email,
        //         'phone_number' => $paySheet->phone_number,
        //         'address' => $paySheet->address,
        //         'municipality' => $paySheet->municipality,
        //         'parish' => $paySheet->parish,
        //         'state' => $paySheet->state,
        //         'city' => $paySheet->city,
        //         'full_name' => $paySheet->full_name,
        //         'date_birth' => $paySheet->date_birth,
        //         'sex' => $paySheet->sex,
        //         'civil_status' => $paySheet->civil_status,
        //         'photo' => $paySheet->photo,
        //         'type_personnel_id' => $typePersonnel?->id,
        //         'asic_id' => $asic?->id,
        //         'receive_pension_from_another_organization_status' => $paySheet->receive_pension_from_another_organization_status,
        //         'has_authorizations' => $paySheet->has_authorizations,
        //         'pension_survivor_status' => $paySheet->pension_survivor_status,
        //         'suspend_payment_status' => $paySheet->suspend_payment_status,
        //         'additional_data' => !empty($additionalData) ? $additionalData : null,
        //         'census_status' => $paySheet->status
        //     ]);

        //     $personnel->update([
        //         'created_at' => $paySheetCreatedAt,
        //         'updated_at' => $paySheetCreatedAt,
        //     ]);

        //     $action = 'create';

        //     if ($paySheet->status) {
        //         $action = 'create_and_census';
        //     }

        //     $auditLog = AuditLog::create([
        //         'action' => $action,
        //         'auditable_type' => Personnel::class,
        //         'auditable_id' => $personnel->id,
        //         'user_id' => $paySheet->user_id ?? 1,
        //         'old_values' => null,
        //         'new_values' => $personnel->toArray(),
        //     ]);

        //     $auditLog->update([
        //         'created_at' => $paySheetCreatedAt,
        //         'updated_at' => $paySheetCreatedAt,
        //     ]);
        // }
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
