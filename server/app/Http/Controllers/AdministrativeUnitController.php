<?php

namespace App\Http\Controllers;

use App\Models\AdministrativeUnit;
use App\Models\Department;
use App\Models\Service;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdministrativeUnitController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = AdministrativeUnit::query();

        if ($request->has('search')) {
            $query->where('name', 'like', '%' . $request->search . '%');
        }

        if ($request->has('dependency_id')) {
            $query->where('dependency_id', $request->dependency_id);
        }

        $units = $query->with('dependency:id,name,asic_id', 'departments:id,name,administrative_unit_id')->get();

        return response()->json($units);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'dependency_id' => 'required|exists:dependencies,id',
            'repeat' => 'boolean',
        ]);

        $unit = AdministrativeUnit::create($validated);

        if ($request->boolean('repeat')) {
            $department = Department::create([
                'name' => $unit->name,
                'administrative_unit_id' => $unit->id,
            ]);

            Service::create([
                'name' => $unit->name,
                'department_id' => $department->id,
            ]);

            $unit->load('departments.services');
        }

        $unit->load('dependency:id,name,asic_id', 'departments:id,name,administrative_unit_id');

        return response()->json($unit, 201);
    }

    public function show(AdministrativeUnit $administrativeUnit): JsonResponse
    {
        $administrativeUnit->load('dependency', 'departments.services');

        return response()->json($administrativeUnit);
    }

    public function update(Request $request, AdministrativeUnit $administrativeUnit): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'dependency_id' => 'required|exists:dependencies,id',
        ]);

        $administrativeUnit->update($validated);
        $administrativeUnit->load('dependency:id,name,asic_id', 'departments:id,name,administrative_unit_id');

        return response()->json($administrativeUnit);
    }

    public function destroy(AdministrativeUnit $administrativeUnit): JsonResponse
    {
        $administrativeUnit->delete();

        return response()->json(null, 204);
    }
}
