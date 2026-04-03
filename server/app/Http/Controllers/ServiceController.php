<?php

namespace App\Http\Controllers;

use App\Models\Service;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ServiceController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Service::query();

        if ($request->has('search')) {
            $query->where('name', 'like', '%' . $request->search . '%');
        }

        if ($request->has('department_id')) {
            $query->where('department_id', $request->department_id);
        }

        $services = $query->with('department:id,name,administrative_unit_id')->get();

        return response()->json($services);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'department_id' => 'required|exists:departments,id',
        ]);

        $service = Service::create($validated);
        $service->load('department:id,name,administrative_unit_id');

        return response()->json($service, 201);
    }

    public function show(Service $service): JsonResponse
    {
        $service->load('department');

        return response()->json($service);
    }

    public function update(Request $request, Service $service): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'department_id' => 'required|exists:departments,id',
        ]);

        $service->update($validated);
        $service->load('department:id,name,administrative_unit_id');

        return response()->json($service);
    }

    public function destroy(Service $service): JsonResponse
    {
        $service->delete();

        return response()->json(null, 204);
    }
}
