<?php

namespace App\Http\Controllers;

use App\Models\TypePaySheet;
use Illuminate\Http\Request;

class TypePaySheetController extends Controller
{
    public function index()
    {
        return TypePaySheet::get();
    }
}
