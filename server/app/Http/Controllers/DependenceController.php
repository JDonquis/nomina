<?php

namespace App\Http\Controllers;

use App\Models\Dependence;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DependenceController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Dependence::query();

        if ($request->has('search')) {
            $query->where('name', 'like', '%' . $request->search . '%');
        }

        if ($request->has('asic_id')) {
            $query->where('asic_id', $request->asic_id);
        }

        $dependences = $query->with('asic:id,name', 'administrativeUnities:id,name,dependence_id')->get();

        return response()->json($dependences);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'asic_id' => 'required|exists:asics,id',
        ]);

        $dependence = Dependence::create($validated);

        return response()->json($dependence, 201);
    }

    public function show(Dependence $dependence): JsonResponse
    {
        $dependence->load('asic', 'administrativeUnities.departments.services');

        return response()->json($dependence);
    }

    public function update(Request $request, Dependence $dependence): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'asic_id' => 'required|exists:asics,id',
        ]);

        $dependence->update($validated);

        return response()->json($dependence);
    }

    public function destroy(Dependence $dependence): JsonResponse
    {
        $dependence->delete();

        return response()->json(null, 204);
    }
}
