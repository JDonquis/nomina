<?php

namespace App\Console\Commands;

use App\Models\Activity;
use App\Models\AdministrativeLocation;
use App\Models\AdministrativeUnit;
use App\Models\ASIC;
use App\Models\Census;
use App\Models\Department;
use App\Models\Dependency;
use App\Models\FamilyMember;
use App\Models\PaySheet;
use App\Models\Service;
use App\Models\TypePaySheet;
use App\Models\TypePersonnel;
use App\Models\User;
use App\Models\ActivePersonnel;
use App\Models\Personnel;
use Illuminate\Console\Command;
use Illuminate\Support\Str;

class GenerateSyncUuids extends Command
{
    protected $signature = 'app:generate-sync-uuids {--model= : Generate UUIDs only for a specific model}';

    protected $description = 'Generate sync_id (UUID) for all models that need synchronization';

    private array $models = [
        'ASIC' => ASIC::class,
        'Dependency' => Dependency::class,
        'AdministrativeUnit' => AdministrativeUnit::class,
        'Department' => Department::class,
        'Service' => Service::class,
        'TypePersonnel' => TypePersonnel::class,
        'TypePaySheet' => TypePaySheet::class,
        'AdministrativeLocation' => AdministrativeLocation::class,
        'Personnel' => Personnel::class,
        'User' => User::class,
    ];

    public function handle(): int
    {
        $modelOption = $this->option('model');
        $modelsToProcess = [];

        if ($modelOption) {
            if (!isset($this->models[$modelOption])) {
                $this->error("Model '{$modelOption}' not found.");
                $this->line('Available models:');
                foreach (array_keys($this->models) as $name) {
                    $this->line("  - {$name}");
                }
                return Command::FAILURE;
            }
            $modelsToProcess = [$modelOption => $this->models[$modelOption]];
        } else {
            $modelsToProcess = $this->models;
        }

        $summary = [];
        $totalUpdated = 0;

        foreach ($modelsToProcess as $name => $modelClass) {
            $count = $modelClass::whereNull('sync_id')->count();

            if ($count === 0) {
                $this->line("✅ {$name}: No records need UUID");
                continue;
            }

            $this->line("📝 Processing {$name}: {$count} records need UUID");

            $bar = $this->output->createProgressBar($count);
            $bar->start();

            $updated = 0;
            $modelClass::whereNull('sync_id')->chunk(100, function ($records) use (&$updated, $bar) {
                foreach ($records as $record) {
                    $record->sync_id = (string) Str::uuid();
                    $record->saveQuietly();
                    $updated++;
                    $bar->advance();
                }
            });

            $bar->finish();
            $this->newLine();

            $summary[$name] = $updated;
            $totalUpdated += $updated;
        }

        $this->newLine();
        $this->line('═══════════════════════════════════════');
        $this->line('              RESUMEN FINAL             ');
        $this->line('═══════════════════════════════════════');

        if (empty($summary)) {
            $this->info('Todos los registros ya tienen sync_id asignado.');
        } else {
            foreach ($summary as $name => $count) {
                $this->line("✅ {$name}: {$count} registros actualizados");
            }
            $this->newLine();
            $this->info("Total: {$totalUpdated} sync_ids generados en " . count($summary) . " modelos");
        }

        return Command::SUCCESS;
    }
}
