<?php

namespace App\Http\Controllers;

use App\Models\Dependency;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DependencyController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Dependency::query();

        if ($request->has('search')) {
            $query->where('name', 'like', '%' . $request->search . '%');
        }

        if ($request->has('asic_id')) {
            $query->where('asic_id', $request->asic_id);
        }

        $dependencies = $query->with('asic:id,name', 'administrativeUnits:id,name,dependency_id')->get();

        return response()->json($dependencies);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'asic_id' => 'required|exists:asics,id',
        ]);

        $dependency = Dependency::create($validated);
        $dependency->load('asic:id,name', 'administrativeUnits:id,name,dependency_id');

        return response()->json($dependency, 201);
    }

    public function show(Dependency $dependency): JsonResponse
    {
        $dependency->load('asic', 'administrativeUnits.departments.services');

        return response()->json($dependency);
    }

    public function update(Request $request, Dependency $dependency): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'asic_id' => 'required|exists:asics,id',
        ]);

        $dependency->update($validated);
        $dependency->load('asic:id,name', 'administrativeUnits:id,name,dependency_id');

        return response()->json($dependency);
    }

    public function destroy(Dependency $dependency): JsonResponse
    {
        $dependency->delete();

        return response()->json(null, 204);
    }
}
