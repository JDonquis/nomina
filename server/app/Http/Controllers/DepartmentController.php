<?php

namespace App\Http\Controllers;

use App\Models\Department;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DepartmentController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Department::query();

        if ($request->has('search')) {
            $query->where('name', 'like', '%' . $request->search . '%');
        }

        if ($request->has('administrative_unity_id')) {
            $query->where('administrative_unity_id', $request->administrative_unity_id);
        }

        $departments = $query->with('administrativeUnit:id,name,dependency_id', 'services:id,name,department_id')->get();

        return response()->json($departments);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'administrative_unit_id' => 'required|exists:administrative_units,id',
        ]);

        $department = Department::create($validated);
        $department->load('administrativeUnit:id,name,dependency_id', 'services:id,name,department_id');

        return response()->json($department, 201);
    }

    public function show(Department $department): JsonResponse
    {
        $department->load('administrativeUnit', 'services');

        return response()->json($department);
    }

    public function update(Request $request, Department $department): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'administrative_unit_id' => 'required|exists:administrative_units,id',
        ]);

        $department->update($validated);
        $department->load('administrativeUnit:id,name,dependency_id', 'services:id,name,department_id');

        return response()->json($department);
    }

    public function destroy(Department $department): JsonResponse
    {
        $department->delete();

        return response()->json(null, 204);
    }
}
