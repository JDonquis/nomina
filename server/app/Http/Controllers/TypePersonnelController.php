<?php

namespace App\Http\Controllers;

use App\Models\TypePersonnel;
use Illuminate\Http\Request;

class TypePersonnelController extends Controller
{
    public function index()
    {
        return response()->json(TypePersonnel::all());
    }

    public function report()
    {
        $report = TypePersonnel::withCount(['personels as total_personnels' => function ($query) {
            $query->where('status', 'active')
                ->where('census_status', true);
        }])
            ->get()
            ->groupBy('type_personal')->map(function ($group) {
                return $group->sum('total_personnels');
            });

        return response()->json($report);
    }

    public function reportByAsic($asic)
    {
        $report = TypePersonnel::withCount(['personels as total_personnels' => function ($query) use ($asic) {
            $query->where('status', 'active')
                ->where('census_status', true)
                ->where('asic_id', $asic);
        }])
            ->get()
            ->groupBy('type_personal')->map(function ($group) {
                return $group->sum('total_personnels');
            });

        return response()->json($report);
    }

    public function reportByDependency($dependency)
    {
        $report = TypePersonnel::withCount(['personels as total_personnels' => function ($query) use ($dependency) {
            $query->where('status', 'active')
                ->where('census_status', true)
                ->where('dependency_id', $dependency);
        }])
            ->get()
            ->groupBy('type_personal')->map(function ($group) {
                return $group->sum('total_personnels');
            });

        return response()->json($report);
    }
}
