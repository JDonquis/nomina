<?php

namespace App\Http\Controllers;

use App\Models\AdministrativeUnity;
use App\Models\Department;
use App\Models\Service;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdministrativeUnityController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = AdministrativeUnity::query();

        if ($request->has('search')) {
            $query->where('name', 'like', '%' . $request->search . '%');
        }

        if ($request->has('dependence_id')) {
            $query->where('dependence_id', $request->dependence_id);
        }

        $unities = $query->with('dependence:id,name,asic_id', 'departments:id,name,administrative_unity_id')->get();

        return response()->json($unities);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'dependence_id' => 'required|exists:dependences,id',
            'repeat' => 'boolean',
        ]);

        $unity = AdministrativeUnity::create($validated);

        if ($request->boolean('repeat')) {
            $department = Department::create([
                'name' => $unity->name,
                'administrative_unity_id' => $unity->id,
            ]);

            Service::create([
                'name' => $unity->name,
                'department_id' => $department->id,
            ]);

            $unity->load('departments.services');
        }

        return response()->json($unity, 201);
    }

    public function show(AdministrativeUnity $administrativeUnity): JsonResponse
    {
        $administrativeUnity->load('dependence', 'departments.services');

        return response()->json($administrativeUnity);
    }

    public function update(Request $request, AdministrativeUnity $administrativeUnity): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'dependence_id' => 'required|exists:dependences,id',
        ]);

        $administrativeUnity->update($validated);

        return response()->json($administrativeUnity);
    }

    public function destroy(AdministrativeUnity $administrativeUnity): JsonResponse
    {
        $administrativeUnity->delete();

        return response()->json(null, 204);
    }
}
