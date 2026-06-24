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
}
