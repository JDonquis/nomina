<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StorePersonnelRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'status' => ['nullable', Rule::in(['active', 'inactive'])],
            'type_personnel_id' => 'required|integer|exists:type_personnels,id',
            'nac' => ['required', Rule::in(['V', 'E'])],
            'ci' => 'required|string|max:20|unique:personnels,ci',
            'full_name' => 'required|string|max:255',
            'date_birth' => 'nullable|string',
            'sex' => 'nullable|string|max:50',
            'civil_status' => 'nullable|string|max:50',
            'phone_number' => 'nullable|string|max:20',
            'email' => 'nullable|email',
            'address' => 'nullable|string',
            'municipality' => 'nullable|string|max:100',
            'parish' => 'nullable|string|max:100',
            'state' => 'nullable|string|max:100',
            'city' => 'nullable|string|max:100',
            'photo' => 'nullable|image|mimes:jpeg,png,jpg|max:2048',
            'asic_id' => 'nullable|integer|exists:asics,id',
            'dependency_id' => 'nullable|integer|exists:dependencies,id',
            'administrative_unit_id' => 'nullable|integer|exists:administrative_units,id',
            'department_id' => 'nullable|integer|exists:departments,id',
            'service_id' => 'nullable|integer|exists:services,id',
            'receive_pension_from_another_organization_status' => 'boolean',
            'has_authorizations' => 'boolean',
            'pension_survivor_status' => 'boolean',
            'suspend_payment_status' => 'boolean',
            'is_resident' => 'boolean',
            'additional_data' => 'nullable|array',
            'to_census' => 'boolean',
        ];
    }

    public function messages(): array
    {
        return [
            'ci.unique' => 'La cédula de identidad ya está registrada.',
            'type_personnel_id.required' => 'El tipo de personal es requerido.',
            'type_personnel_id.exists' => 'El tipo de personal seleccionado no existe.',
            'nac.required' => 'La nacionalidad es requerida.',
            'ci.required' => 'La cédula de identidad es requerida.',
            'full_name.required' => 'El nombre completo es requerido.',
        ];
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'receive_pension_from_another_organization_status' => $this->boolean('receive_pension_from_another_organization_status'),
            'has_authorizations' => $this->boolean('has_authorizations'),
            'pension_survivor_status' => $this->boolean('pension_survivor_status'),
            'suspend_payment_status' => $this->boolean('suspend_payment_status'),
            'is_resident' => $this->boolean('is_resident'),
            'sex' => $this->sex ?? 'Sin asignar',
            'civil_status' => $this->civil_status ?? 'Sin asignar',
            'city' => $this->city ?? 'Sin asignar',
            'state' => $this->state ?? 'Falcon',
            'status' => $this->status ?? 'active',
        ]);
    }
}
