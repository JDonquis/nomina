<?php

namespace App\Services;

use Carbon\Carbon;
use App\Models\Census;
use Illuminate\Support\Facades\Auth;

class CensusService
{

    public function store($data)
    {

        $data['status'] = true;
        $data['expiration_date'] = Carbon::now()->endOfYear()->format('Y-m-d');
        $data['user_id'] = Auth::id();
        $census = Census::create($data);

        return $census;
    }

    public function destroy(Census $census)
    {
        $census->delete();

        return 0;
    }
}
