<?php

use App\Http\Controllers\ActivityController;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\UserController;
use App\Http\Controllers\LoginController;
use App\Http\Controllers\CensusController;
use App\Http\Controllers\RepositoryController;
use App\Http\Controllers\ASICController;
use App\Http\Controllers\DependencyController;
use App\Http\Controllers\AdministrativeUnitController;
use App\Http\Controllers\DepartmentController;
use App\Http\Controllers\ServiceController;
use App\Http\Controllers\TypePersonnelController;
use App\Http\Controllers\PersonnelController;

Route::post('login', [LoginController::class, 'login'])->name('login');
Route::post('verify-invitation', [LoginController::class, 'checkSetPasswordToken']);
Route::post('activate-account', [LoginController::class, 'setPassword']);

Route::post('forgot-password', [LoginController::class, 'forgotPassword'])->name('login');



Route::middleware('auth:sanctum')->prefix('admin')->group(function () {

    // Route::post('refresh_token', [LoginController::class, 'refreshToken'])->name('refresh_token');
    Route::post('logout', [LoginController::class, 'logout'])->name('logout');

    Route::get('type-personnels', [TypePersonnelController::class, 'index']);

    Route::resource('users', UserController::class)->except(['edit', 'create'])
        ->middleware('admin');

    // Census
    Route::get('censuses/export', [CensusController::class, 'export']);
    Route::post('censuses/import', [CensusController::class, 'import']);
    Route::get('censuses', [CensusController::class, 'index']);
    Route::post('censuses', [CensusController::class, 'store']);
    Route::delete('censuses/{census}', [CensusController::class, 'destroy']);

    // Personnel (Fe de Vida)
    Route::get('personnels/life_proof', [PersonnelController::class, 'lifeProof']);
    Route::post('personnels/life_proof', [PersonnelController::class, 'store']);
    Route::get('personnels/life_proof/{personnel}', [PersonnelController::class, 'show']);
    Route::put('personnels/life_proof/{personnel}', [PersonnelController::class, 'update']);
    Route::post('personnels/life_proof/photo/{personnel}', [PersonnelController::class, 'updatePhoto']);

    // Personnel Active
    Route::get('personnels/active/export-template', [PersonnelController::class, 'exportTemplate']);
    Route::get('personnels/active', [PersonnelController::class, 'active']);
    Route::post('personnels/active', [PersonnelController::class, 'store']);
    Route::put('personnels/active/{personnel}', [PersonnelController::class, 'update']);
    Route::get('personnels/active/{personnel}', [PersonnelController::class, 'show']);
    Route::post('personnels/active/photo/{personnel}', [PersonnelController::class, 'updatePhoto']);
    Route::post('personnels/active/import-excel', [PersonnelController::class, 'importExcel']);

    Route::get('activities', ActivityController::class);


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

    // Estructura organizacional
    Route::resource('asics', ASICController::class)->except(['edit', 'create']);
    Route::resource('dependencies', DependencyController::class)->except(['edit', 'create']);
    Route::resource('administrative-units', AdministrativeUnitController::class)->except(['edit', 'create']);
    Route::resource('departments', DepartmentController::class)->except(['edit', 'create']);
    Route::resource('services', ServiceController::class)->except(['edit', 'create']);
});
