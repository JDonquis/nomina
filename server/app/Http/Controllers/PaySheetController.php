<?php

namespace App\Http\Controllers;

use Exception;
use App\Models\PaySheet;
use Illuminate\Http\Request;
use App\Services\PaySheetService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use League\Config\Exception\ValidationException;

class PaySheetController extends Controller
{
    protected $paySheetService;

    public function __construct()
    {
        $this->paySheetService = new PaySheetService;
    }

    public function index(Request $request)
    {
        $paySheets = $this->paySheetService->get($request->all());

        return response()->json([
            'message' => 'OK',
            'paySheets' => $paySheets
        ]);
    }



    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        try {
            DB::beginTransaction();

            $result = $this->paySheetService->store($request);

            DB::commit();

            $response = [
                'message' => 'Nómina importada exitosamente',
                'inserted_count' => $result['inserted']
            ];

            if (!empty($result['errors'])) {
                $response['errors'] = $result['errors'];
                $response['error_count'] = count($result['errors']);
                $response['message'] = 'Nómina importada con algunos errores';
            }

            return response()->json($response);
        } catch (ValidationException $e) {
            Log::error('Error al importar nómina: ', [
                'message' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine()
            ]);

            return response()->json([
                'status' => false,
                'message' => 'Ha ocurrido un error al importar nómina :' . $e->getMessage()
            ], 500);
        } catch (Exception $e) {
            DB::rollBack();

            Log::error('Error al importar nómina: ', [
                'message' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine()
            ]);

            return response()->json([
                'status' => false,
                'message' => 'Ha ocurrido un error al importar nómina'
            ], 500);
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(PaySheet $paySheet)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(PaySheet $paySheet)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, PaySheet $paySheet)
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(PaySheet $paySheet)
    {
        //
    }
}
