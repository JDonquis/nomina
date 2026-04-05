<?php

namespace App\Services;

use App\Models\ActivePersonnel;
use App\Models\FamilyMember;
use App\Models\Census;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class ActivePersonnelService
{
    public function get($params = [])
    {
        $query = ActivePersonnel::query()->with(['asic', 'dependency', 'administrativeUnit', 'department', 'service', 'familyMembers', 'censuses']);

        if (!empty($params['search'])) {
            $search = $params['search'];
            $query->where(function ($q) use ($search) {
                $q->where('ci', 'LIKE', "%{$search}%")
                    ->orWhere('full_name', 'LIKE', "%{$search}%")
                    ->orWhere('email', 'LIKE', "%{$search}%");
            });
        }

        if (!empty($params['filters'])) {
            $filters = is_string($params['filters']) ? json_decode($params['filters'], true) : $params['filters'];
            
            foreach (['ci', 'full_name', 'email', 'status', 'asic_id', 'dependency_id'] as $field) {
                if (isset($filters[$field])) {
                    $query->where($field, $filters[$field]);
                }
            }
        }

        $perPage = $params['per_page'] ?? 15;
        return $query->paginate($perPage);
    }

    public function store($data, $photo = null, $idCardPhoto = null)
    {
        return DB::transaction(function () use ($data, $photo, $idCardPhoto) {
            $userID = Auth::id();
            $data['user_id'] = $userID;
            
            if ($photo) {
                $data['photo'] = $photo->store('photos', 'public');
            }

            if ($idCardPhoto) {
                $data['id_card_photo'] = $idCardPhoto->store('id_cards', 'public');
            }

            $familyMembers = $data['family_members'] ?? [];
            unset($data['family_members']);

            $personnel = ActivePersonnel::create($data);

            foreach ($familyMembers as $member) {
                $personnel->familyMembers()->create($member);
            }

            if (isset($data['to_census']) && $data['to_census']) {
                $census = Census::create([
                    'active_personnel_id' => $personnel->id,
                    'status' => true,
                    'expiration_date' => Carbon::now()->endOfYear()->format('Y-m-d'),
                    'user_id' => $userID,
                    'data' => $personnel->load('asic', 'dependency', 'administrativeUnit', 'department', 'service', 'familyMembers')
                ]);
                $personnel->update(['latest_census_id' => $census->id]);
            }

            return $personnel->load('familyMembers');
        });
    }

    public function update($data, ActivePersonnel $personnel)
    {
        return DB::transaction(function () use ($data, $personnel) {
            $userID = Auth::id();
            $familyMembers = $data['family_members'] ?? [];
            unset($data['family_members']);

            $personnel->update($data);

            if (!empty($familyMembers)) {
                $personnel->familyMembers()->delete();
                foreach ($familyMembers as $member) {
                    $personnel->familyMembers()->create($member);
                }
            }

            if (isset($data['to_census']) && $data['to_census']) {
                // Actualizamos el status de los demas censos
                Census::where('active_personnel_id', $personnel->id)->update(['status' => false]);

                $census = Census::create([
                    'active_personnel_id' => $personnel->id,
                    'status' => true,
                    'expiration_date' => Carbon::now()->endOfYear()->format('Y-m-d'),
                    'user_id' => $userID,
                    'data' => $personnel->load('asic', 'dependency', 'administrativeUnit', 'department', 'service', 'familyMembers')
                ]);
                $personnel->update(['latest_census_id' => $census->id]);
            }

            return $personnel->load('familyMembers');
        });
    }

    public function destroy(ActivePersonnel $personnel)
    {
        return $personnel->delete();
    }
}
