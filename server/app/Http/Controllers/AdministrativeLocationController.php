<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\AdministrativeLocation;
class AdministrativeLocationController extends Controller
{
    public function index(){
        return AdministrativeLocation::get();
    }
}
