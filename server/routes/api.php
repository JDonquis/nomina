<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\UserController;
use App\Http\Controllers\LoginController;

Route::post('login', [LoginController::class, 'login'])->name('login');

Route::middleware('auth:sanctum')->prefix('admin')->group(function () {

    // Route::post('refresh_token', [LoginController::class, 'refreshToken'])->name('refresh_token');

    Route::resource('users', UserController::class)->except(['edit', 'create']);



    Route::post('logout', [LoginController::class, 'logout'])->name('logout');
    Route::get('test', [LoginController::class, 'test']);
});
