<?php

namespace App\Console\Commands;

use App\Models\Personnel;
use App\Services\PersonnelService;
use Illuminate\Console\Command;

class FixIncompleteActiveCensus extends Command
{
    protected $signature = 'app:fix-incomplete-active-census
                            {--dry-run : Muestra los registros afectados sin modificar nada}
                            {--force : Ejecuta sin pedir confirmación}';

    protected $description = 'Pone census_status=false a personal activo censado sin ASIC, dependencia, unidad administrativa, departamento o servicio';

    public function handle(PersonnelService $personnelService): int
    {
        $dryRun = (bool) $this->option('dry-run');

        $locationFields = array_keys($personnelService->locationFieldLabels());

        $query = Personnel::where('status', 'active')
            ->where('census_status', true)
            ->where(function ($query) use ($locationFields) {
                foreach ($locationFields as $field) {
                    $query->orWhereNull($field);
                }
            })
            ->orderBy('id');

        $total = (clone $query)->count();

        if ($total === 0) {
            $this->info('No hay personal activo censado con ubicación incompleta.');
            return Command::SUCCESS;
        }

        if (!$dryRun && !$this->option('force') && !$this->confirm("Se corregirán {$total} registros. ¿Desea continuar?", true)) {
            $this->warn('Operación cancelada.');
            return Command::SUCCESS;
        }

        $rows = [];
        $corrected = 0;

        $query->chunkById(200, function ($personnels) use ($personnelService, $dryRun, &$rows, &$corrected) {
            foreach ($personnels as $personnel) {
                $missing = $personnelService->missingLocationFields($personnel->toArray());

                if (empty($missing)) {
                    continue;
                }

                $rows[] = [
                    $personnel->id,
                    $personnel->ci,
                    $personnel->full_name,
                    implode(', ', $missing),
                ];

                if (!$dryRun) {
                    // saveQuietly para no disparar eventos de auditoría masivos.
                    $personnel->census_status = false;
                    $personnel->census_date = null;
                    $personnel->saveQuietly();
                    $corrected++;
                }
            }
        });

        $this->newLine();
        $this->table(['ID', 'Cédula', 'Nombre', 'Campos faltantes'], $rows);

        if ($dryRun) {
            $this->info("[DRY-RUN] Registros que se corregirían: {$total}. No se modificó nada.");
        } else {
            $this->info("Registros corregidos (census_status=false): {$corrected}.");
        }

        return Command::SUCCESS;
    }
}
