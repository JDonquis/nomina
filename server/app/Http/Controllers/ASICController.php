<?php

namespace App\Http\Controllers;

use App\Models\ASIC;
use App\Models\Personnel;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ASICController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = ASIC::query();

        if ($request->has('search')) {
            $query->where('name', 'like', '%' . $request->search . '%');
        }

        $asics = $query->with('dependencies')->orderBy('name', 'asc')->get();

        return response()->json($asics);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'coordinates' => 'nullable|string|max:255',
            'address' => 'nullable|string|max:255',
            'url' => 'nullable|string|max:255',
        ]);

        $asic = ASIC::create($validated);
        $asic->load('dependencies');

        return response()->json($asic, 201);
    }

    public function show(ASIC $asic): JsonResponse
    {



        $censusedPersonnelFilter = function ($query) {
            $query->where('status', 'active')
                ->where('census_status', true);
        };

        $asic->loadCount(['personnels as active_censused_count' => $censusedPersonnelFilter]);

        // 2. Cargamos el árbol de relaciones con sus respectivos conteos
        $asic->load([
            // Nivel 1: Dependencias y su conteo de censados
            'dependencies' => function ($query) use ($censusedPersonnelFilter) {
                $query->select(['id', 'asic_id', 'name', 'coordinates', 'address', 'url'])
                    ->withCount(['personnels as active_censused_count' => $censusedPersonnelFilter]);
            },

            // Nivel 2: Unidades Administrativas y su propio conteo de censados
            'dependencies.administrativeUnits' => function ($query) use ($censusedPersonnelFilter) {
                $query->select(['id', 'dependency_id', 'name'])
                    ->withCount(['personnels as active_censused_count' => $censusedPersonnelFilter]);
            },

            // Nivel 3: Departamentos y su propio conteo de censados
            'dependencies.administrativeUnits.departments' => function ($query) use ($censusedPersonnelFilter) {
                $query->select(['id', 'administrative_unit_id', 'name'])
                    ->withCount(['personnels as active_censused_count' => $censusedPersonnelFilter]);
            },

            // Nivel 4: Servicios y su propio conteo de censados
            'dependencies.administrativeUnits.departments.services' => function ($query) use ($censusedPersonnelFilter) {
                $query->select(['id', 'department_id', 'name'])
                    ->withCount(['personnels as active_censused_count' => $censusedPersonnelFilter]);
            }
        ]);

        return response()->json($asic);
    }

    public function update(Request $request, ASIC $asic): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'coordinates' => 'nullable|string|max:255',
            'address' => 'nullable|string|max:255',
            'url' => 'nullable|string|max:255',
        ]);

        $asic->update($validated);
        $asic->load('dependencies:id,name,asic_id');

        return response()->json($asic);
    }

    public function destroy(ASIC $asic): JsonResponse
    {
        $asic->delete();

        return response()->json(null, 204);
    }

    public function report(ASIC $asic): JsonResponse
    {
        $personnels = Personnel::with('asic', 'dependency', 'administrativeUnit', 'department', 'service')
            ->where('asic_id', $asic->id)
            ->where('status', 'active')
            ->where('census_status', true)
            ->get();

        return response()->json($personnels);
    }

    public function reportAllDetailed()
    {
        $personnels = Personnel::with('asic', 'dependency', 'administrativeUnit', 'department', 'service')
            ->where('status', 'active')
            ->where('census_status', true)
            ->get();

        return response()->json($personnels);
    }

    public function reportPerJob(ASIC $asic): JsonResponse
    {
        $personnels = Personnel::where('asic_id', $asic->id)
            ->where('status', 'active')
            ->where('census_status', true)
            ->get();

        $report = $personnels
            ->groupBy(function ($personnel) {
                return $personnel->additional_data['job_title'] ?? 'Sin Cargo Asignado';
            })
            ->map(function ($group) {
                return $group->count();
            });

        return response()->json($report);
    }

    public function reportAllPerJob(): JsonResponse
    {
        $personnels = Personnel::where('status', 'active')
            ->where('census_status', true)
            ->get();

        $report = $personnels
            ->groupBy(function ($personnel) {
                return $personnel->additional_data['job_title'] ?? 'Sin Cargo Asignado';
            })
            ->map(function ($group) {
                return $group->count();
            });

        return response()->json($report);
    }
}
