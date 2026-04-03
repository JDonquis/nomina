<?php

namespace App\Http\Controllers;

use App\Models\ASIC;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ASICController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = ASIC::query();

        if ($request->has('search')) {
            $query->where('name', 'like', '%' . $request->search . '%');
        }

        $asics = $query->with('dependencies:id,name,asic_id')->get();

        return response()->json($asics);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
        ]);

        $asic = ASIC::create($validated);
        $asic->load('dependencies:id,name,asic_id');

        return response()->json($asic, 201);
    }

    public function show(ASIC $asic): JsonResponse
    {
        $asic->load('dependencies.administrativeUnits.departments.services');

        return response()->json($asic);
    }

    public function update(Request $request, ASIC $asic): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
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
}
