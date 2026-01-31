<?php

use App\Http\Controllers\CensusController;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\UserController;
use App\Http\Controllers\LoginController;
use App\Http\Controllers\PaySheetController;

Route::post('login', [LoginController::class, 'login'])->name('login');

Route::middleware('auth:sanctum')->prefix('admin')->group(function () {

    // Route::post('refresh_token', [LoginController::class, 'refreshToken'])->name('refresh_token');

    Route::resource('users', UserController::class)->except(['edit', 'create']);



    Route::post('logout', [LoginController::class, 'logout'])->name('logout');
    Route::resource('pay-sheets', PaySheetController::class)->except(['edit', 'create']);
    Route::post('pay-sheets/sheet', [PaySheetController::class, 'storeSheet']);
    Route::post('censuses', [CensusController::class, 'store']);
    Route::delete('censuses/{census}', [CensusController::class, 'destroy']);
});
