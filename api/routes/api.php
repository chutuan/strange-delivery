<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\BidController;
use App\Http\Controllers\Api\DriverController;
use App\Http\Controllers\Api\OrderController;
use App\Http\Controllers\Api\RatingController;
use Illuminate\Support\Facades\Route;

// Auth
Route::post('/auth/register', [AuthController::class, 'register']);
Route::post('/auth/login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::get('/auth/me', [AuthController::class, 'me']);

    // Driver
    Route::post('/driver/register', [DriverController::class, 'register']);
    Route::get('/driver/profile', [DriverController::class, 'profile']);
    Route::put('/driver/profile', [DriverController::class, 'update']);

    // Orders — sender
    Route::get('/orders/mine', [OrderController::class, 'mySentOrders']);
    Route::post('/orders', [OrderController::class, 'store']);
    Route::post('/orders/{order}/cancel', [OrderController::class, 'cancel']);
    Route::post('/orders/{order}/accept-bid/{bid}', [OrderController::class, 'acceptBid']);
    Route::post('/orders/{order}/deliver', [OrderController::class, 'deliver']);

    // Orders — driver
    Route::get('/orders/open', [OrderController::class, 'openOrders']);

    // Order detail
    Route::get('/orders/{order}', [OrderController::class, 'show']);

    // Bids
    Route::get('/orders/{order}/bids', [BidController::class, 'index']);
    Route::post('/orders/{order}/bids', [BidController::class, 'store']);

    // Ratings
    Route::post('/orders/{order}/rate', [RatingController::class, 'store']);
});
