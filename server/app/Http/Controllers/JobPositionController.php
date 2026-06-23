<?php

namespace App\Http\Controllers;

use App\Services\JobPositionService;
use Illuminate\Http\Request;

class JobPositionController extends Controller
{
    protected $jobPositionService;
    public function __construct()
    {
        $this->jobPositionService = new JobPositionService;
    }

    public function index(Request $request)
    {
        $search = $request->query('search', null);

        $jobPositions = $this->jobPositionService->getJobPositions($search);

        return response()->json([
            'message' => 'OK',
            'job_positions' => $jobPositions,
        ]);
    }
}
