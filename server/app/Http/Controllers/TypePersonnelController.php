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
}