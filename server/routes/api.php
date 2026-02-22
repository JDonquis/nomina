<?php

use App\Http\Controllers\ActivityController;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\UserController;
use App\Http\Controllers\LoginController;
use App\Http\Controllers\CensusController;
use App\Http\Controllers\PaySheetController;
use App\Http\Controllers\RepositoryController;
use App\Http\Controllers\TypePaySheetController;
use App\Http\Controllers\AdministrativeLocationController;

Route::post('login', [LoginController::class, 'login'])->name('login');
Route::post('verify-invitation', [LoginController::class, 'checkSetPasswordToken']);
Route::post('activate-account', [LoginController::class, 'setPassword']);

Route::post('forgot-password', [LoginController::class, 'forgotPassword'])->name('login');



Route::middleware('auth:sanctum')->prefix('admin')->group(function () {

    // Route::post('refresh_token', [LoginController::class, 'refreshToken'])->name('refresh_token');
    Route::post('logout', [LoginController::class, 'logout'])->name('logout');

    Route::get('administrative-locations', [AdministrativeLocationController::class, 'index']);
    Route::get('type-pay-sheets', [TypePaySheetController::class, 'index']);


    Route::resource('users', UserController::class)->except(['edit', 'create']);


    Route::resource('pay-sheets', PaySheetController::class)->except(['edit', 'create']);
    Route::post('pay-sheets/sheet', [PaySheetController::class, 'storeSheet']);
    Route::post('pay-sheets/photo/{paySheet}', [PaySheetController::class, 'updatePhoto']);

    // Census
    Route::get('censuses', [CensusController::class, 'index']);
    // Route::post('censuses', [CensusController::class, 'store']);
    Route::delete('censuses/{census}', [CensusController::class, 'destroy']);

    Route::get('activities',ActivityController::class);


    Route::prefix('repositories')->group(function () {
        // CRUD básico
        Route::get('/', [RepositoryController::class, 'index']);
        Route::get('/{repository}', [RepositoryController::class, 'show']);
        Route::delete('/{repository}', [RepositoryController::class, 'destroy']);

        // Exportar datos
        Route::post('/export', [RepositoryController::class, 'storeExport']);

        // Importar datos
        Route::post('/import', [RepositoryController::class, 'storeImport']);
        Route::post('/import/preview', [RepositoryController::class, 'previewImport']);

        // Descargar y ver contenido
        Route::get('/{repository}/download', [RepositoryController::class, 'download']);
        Route::get('/{repository}/content', [RepositoryController::class, 'getFileContent']);
    });

    // Opcional: rutas de compatibilidad
    Route::prefix('data-migration')->group(function () {
        Route::post('/export', [RepositoryController::class, 'storeExport']);
        Route::post('/import', [RepositoryController::class, 'storeImport']);
        Route::post('/import/preview', [RepositoryController::class, 'previewImport']);
    });
});
