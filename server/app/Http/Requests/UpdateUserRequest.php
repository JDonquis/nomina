<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateUserRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {

        $userId = $this->route('user');

        return [
            'full_name' => ['required', 'string', 'max:255'],

            'charge' => ['required', 'string'],
            'email' => [
                'sometimes',
                'required',
                'email',
                'max:255',
                Rule::unique('users')->ignore($userId)
            ],
            'is_admin' => ['sometimes', 'required', 'boolean'],
            'password' => [
                'sometimes',
                'nullable',
                'confirmed',
                'min:4',
            ],
            'password_confirmation' => ['sometimes', 'nullable', 'min:4'],
            'email_verified_status' => ['sometimes', 'boolean'],
            'status' => ['required','boolean'],
            'asic_id' => ['nullable', 'integer', 'exists:asics,id', 'required_with:dependency_id,administrative_unit_id,department_id,service_id'],
            'dependency_id' => ['nullable', 'integer', 'exists:dependencies,id', 'required_with:administrative_unit_id,department_id,service_id'],
            'administrative_unit_id' => ['nullable', 'integer', 'exists:administrative_units,id', 'required_with:department_id,service_id'],
            'department_id' => ['nullable', 'integer', 'exists:departments,id', 'required_with:service_id'],
            'service_id' => ['nullable', 'integer', 'exists:services,id'],
            'can_register_personnel' => ['nullable', 'boolean'],

        ];
    }
}
