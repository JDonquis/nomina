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
            'full_name' => ['sometimes', 'required', 'string', 'max:255'],
            'ci' => [
                'sometimes',
                'required',
                'string',
                'max:20',
                Rule::unique('users')->ignore($userId)
            ],
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
            'password_confirmation' => ['sometimes', 'nullable', 'min:4']

        ];
    }
}
