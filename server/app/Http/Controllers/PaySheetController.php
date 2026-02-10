<?php

namespace App\Http\Controllers;

use App\Http\Requests\StorePaySheetRequest;
use App\Http\Requests\UpdatePaySheetRequest;
use App\Http\Requests\UpdatePhotoPaySheetRequest;
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
    public function store(StorePaySheetRequest $request)
    {
        try {
            DB::beginTransaction();

            $validatedData = $request->validated();

            $photo = $request->hasFile('photo') ? $request->file('photo') : null;

            $register = $this->paySheetService->store($validatedData, $photo);

            DB::commit();

            return response()->json([
                'message' => 'Registro insertado exitosamente',
                'register' => $register
            ]);
        } catch (ValidationException $e) {
            Log::error('Error al importar nómina: ', [
                'message' => $e->getMessage(),
                'line' => $e->getLine()
            ]);

            return response()->json([
                'status' => false,
                'message' => 'Ha ocurrido un error al crear registro :' . $e->getMessage()
            ], 500);
        } catch (Exception $e) {
            DB::rollBack();

            Log::error('Error al crear registro: ', [
                'message' => $e->getMessage(),
                'line' => $e->getLine()
            ]);

            return response()->json([
                'status' => false,
                'message' => 'Ha ocurrido un error al crear registro'
            ], 500);
        }
    }

    public function storeSheet(Request $request)
    {
        try {
            DB::beginTransaction();

            $result = $this->paySheetService->storeSheet($request);

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


    public function update(UpdatePaySheetRequest $request, PaySheet $paySheet)
    {
        try {
            DB::beginTransaction();

            $validatedData = $request->validated();

            $register = $this->paySheetService->update($validatedData, $paySheet);

            DB::commit();

            return response()->json([
                'message' => 'Registro actualizado exitosamente',
                'register' => $register
            ]);
        } catch (ValidationException $e) {
            return response()->json([
                'status' => false,
                'message' => 'Error de validación: ' . $e->getMessage()
            ], 422);
        } catch (Exception $e) {
            DB::rollBack();

            Log::error('Error al actualizar registro: ', [
                'message' => $e->getMessage(),
                'line' => $e->getLine()
            ]);

            return response()->json([
                'status' => false,
                'message' => 'Ha ocurrido un error al actualizar registro'
            ], 500);
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(PaySheet $paySheet)
    {
        try {

            DB::beginTransaction();

            $this->paySheetService->destroy($paySheet);

            DB::commit();

            return response()->json([
                'status' => true,
                'message' => 'Registro eliminado exitosamente',
            ]);
        } catch (Exception $e) {

            DB::rollBack();

            Log::error('Error al eliminar el registro', [
                'message' => $e->getMessage(),
                'line' => $e->getLine()
            ]);
            return response()->json([
                'status' => false,
                'message' => 'Ha ocurrido un error al eliminar el registro '
            ], 500);
        }
    }

    public function updatePhoto(UpdatePhotoPaySheetRequest $request, PaySheet $paySheet)
    {

        try {
            $photo = $request->file('photo');

            $this->paySheetService->updatePhoto($photo, $paySheet);

            return response()->json([
                'message' => 'Foto actualizada exitosamente',
            ]);
        } catch (Exception $e) {

            Log::error('Error al actualizar foto del registro: ', [
                'message' => $e->getMessage(),
                'line' => $e->getLine()
            ]);

            return response()->json([
                'status' => false,
                'message' => 'Ha ocurrido un error al actualizar la foto'
            ], 500);
        }
    }
}
