<?php

namespace App\Http\Controllers;

use App\Services\AuditLogService;
use Illuminate\Http\Request;

class AuditLogController extends Controller
{

    protected $auditLogService;

    public function __construct()
    {
        $this->auditLogService = new AuditLogService;
    }

    public function index(Request $request)
    {
        $filters = $request->all();

        $activities = $this->auditLogService->get($filters);

        return response()->json([
            'message' => 'OK',
            'activities' => $activities
        ]);
    }
}
