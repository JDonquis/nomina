<?php

namespace App\Observers;

use App\Models\Census;
use App\Models\Activity;
use App\Enums\ActivityEnum;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Auth;

class CensusObserver
{
    /**
     * Handle the Census "created" event.
     */
    public function created(Census $census): void
    {

        if (Auth::check()) {
            $userID =  Auth::id();

            Activity::create([
                'user_id' => $userID,
                'id_affected' => $census->id,
                'activity' => ActivityEnum::CENSUS_CREATED,
            ]);
        } else {
            Log::info('No se pudo crear el activity');
        }
    }

    /**
     * Handle the Census "updated" event.
     */
    public function updated(Census $census): void
    {
        //
    }

    /**
     * Handle the Census "deleted" event.
     */
    public function deleted(Census $census): void
    {
        if (Auth::check()) {
            $userID =  Auth::id();

            Activity::create([
                'user_id' => $userID,
                'id_affected' => $census->id,
                'activity' => ActivityEnum::CENSUS_DELETED,
            ]);
        } else {
            Log::info('No se pudo crear el activity');
        }
    }

    /**
     * Handle the Census "restored" event.
     */
    public function restored(Census $census): void
    {
        //
    }

    /**
     * Handle the Census "force deleted" event.
     */
    public function forceDeleted(Census $census): void
    {
        //
    }
}
