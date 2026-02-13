<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdatePaySheetRequest extends FormRequest
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
        $paySheetId = $this->route('pay_sheet') ? $this->route('pay_sheet')->id : null;

        return [
            // Personal Data
            'nac' => ['required', Rule::in(['V', 'E'])],
            'ci' => [
                'required',
                'string',
                'max:20',
                Rule::unique('pay_sheets', 'ci')->ignore($paySheetId)
            ],
            'full_name' => 'required|string|max:255',
            'date_birth' => 'nullable|date',
            'sex' => 'nullable|string|in:M,F,Sin asignar',
            'city' => 'nullable|string|max:100',
            'state' => 'nullable|string|max:100',
            'administrative_location_id' => 'nullable|integer|exists:administrative_locations,id',
            'phone_number' => 'nullable|string|max:20',
            'photo' => 'nullable|image|mimes:jpeg,png,jpg|max:2048',
            'email' => 'nullable|email',
            'municipality' => ['nullable',Rule::in([
                'Acosta',
                'Bolívar',
                'Buchivacoa',
                'Cacique Manaure',
                'Carirubana',
                'Colina',
                'Dabajuro',
                'Democracia',
                'Falcón',
                'Federación',
                'Jacura',
                'José Laurencio Silva',
                'Los Taques',
                'Mauroa',
                'Miranda',
                'Monseñor Iturriza',
                'Palmasola',
                'Petit',
                'Píritu',
                'San Francisco',
                'Sucre',
                'Tocópero',
                'Unión',
                'Urumaco',
                'Zamora'
            ])],
            'parish' => ['nullable', Rule::in([
            // Municipio Acosta
            'Capadare',
            'La Pastora',
            'Libertador',
            'San Juan de los Cayos',
            // Municipio Bolívar
            'Aracua',
            'La Peña',
            'San Luis',
            // Municipio Buchivacoa
            'Bariro',
            'Borojó',
            'Capatárida',
            'Guajiro',
            'Seque',
            'Valle de Eroa',
            'Zazárida',
            // Municipio Cacique Manaure
            'Cacique Manaure',
            // Municipio Carirubana
            'Norte',
            'Carirubana',
            'Santa Ana',
            'Urbana Punta Cardón',
            // Municipio Colina
            'La Vela de Coro',
            'Acurigua',
            'Guaibacoa',
            'Las Calderas',
            'Mataruca',
            // Municipio Dabajuro
            'Dabajuro',
            // Municipio Democracia
            'Agua Clara',
            'Avaria',
            'Pedregal',
            'Piedra Grande',
            'Purureche',
            // Municipio Falcón
            'Adaure',
            'Adícora',
            'Baraived',
            'Buena Vista',
            'Jadacaquiva',
            'El Vínculo',
            'El Hato',
            'Moruy',
            'Pueblo Nuevo',
            // Municipio Federación
            'Agua Larga',
            'Churuguara',
            'El Paují',
            'Independencia',
            'Mapararí',
            // Municipio Jacura
            'Agua Linda',
            'Araurima',
            'Jacura',
            // Municipio José Laurencio Silva
            'Tucacas',
            'Boca de Aroa',
            // Municipio Los Taques
            'Los Taques',
            'Judibana',
            // Municipio Mauroa
            'Mene de Mauroa',
            'San Félix',
            'Casigua',
            // Municipio Miranda
            'Guzmán Guillermo',
            'Mitare',
            'Río Seco',
            'Sabaneta',
            'San Antonio',
            'San Gabriel',
            'Santa Ana',
            // Municipio Monseñor Iturriza
            'Boca del Tocuyo',
            'Chichiriviche',
            'Tocuyo de la Costa',
            // Municipio Palmasola
            'Palmasola',
            // Municipio Petit
            'Cabure',
            'Colina',
            'Curimagua',
            // Municipio Píritu
            'San José de la Costa',
            'Píritu',
            // Municipio San Francisco
            'Mirimire',
            // Municipio Sucre
            'Sucre',
            'Pecaya',
            // Municipio Tocópero
            'Tocópero',
            // Municipio Unión
            'El Charal',
            'Las Vegas del Tuy',
            'Santa Cruz de Bucaral',
            // Municipio Urumaco
            'Bruzual',
            'Urumaco',
            // Municipio Zamora
            'Puerto Cumarebo',
            'La Ciénaga',
            'La Soledad',
            'Pueblo Cumarebo',
            'Zazárida'
        ])],

            // Pension Data
            'type_pension' => ['nullable', Rule::in(['Jubilacion', 'Incapacidad', 'Sobrevivencia'])],
            'type_pay_sheet_id' => 'nullable|integer|exists:type_pay_sheets,id',
            'last_charge' => 'nullable|string|max:255',
            'civil_status' => ['nullable', Rule::in(['S', 'C', 'V'])],
            'minor_child_nro' => 'integer|min:0',
            'disabled_child_nro' => 'integer|min:0',
            'receive_pension_from_another_organization_status' => 'boolean',
            'another_organization_name' => 'nullable|string|max:255',
            'has_authorizations' => 'boolean',

            // Pension Survivor (condicionales)
            'pension_survivor_status' => 'boolean',
            'fullname_causative' => 'nullable|required_if:pension_survivor_status,true|string|max:255',
            'age_causative' => 'nullable|required_if:pension_survivor_status,true|integer|min:0|max:120',
            'parent_causative' => ['nullable', 'required_if:pension_survivor_status,true', Rule::in(['Padre', 'Madre', 'Conyuge', 'Concubino'])],
            'sex_causative' => ['nullable', 'required_if:pension_survivor_status,true', Rule::in(['M', 'F'])],
            'ci_causative' => 'nullable|string|max:20',
            'decease_date' => 'nullable|date',
            'suspend_payment_status' => 'boolean',
            'last_payment' => 'nullable|date',
        ];
    }

    /**
     * Get custom messages for validator errors.
     */
    public function messages(): array
    {
        return [
            'ci.unique' => 'La cédula de identidad ya está registrada en el sistema.',
            'fullname_causative.required_if' => 'El nombre del causante es requerido cuando es pensión de sobrevivencia.',
            'age_causative.required_if' => 'La edad del causante es requerida cuando es pensión de sobrevivencia.',
            'parent_causative.required_if' => 'El parentesco del causante es requerido cuando es pensión de sobrevivencia.',
            'sex_causative.required_if' => 'El sexo del causante es requerido cuando es pensión de sobrevivencia.',

            // Personal Data
            'nac.required' => 'La nacionalidad es requerida.',
            'nac.in' => 'La nacionalidad debe ser V o E.',
            'ci.required' => 'La cédula de identidad es requerida.',
            'full_name.required' => 'El nombre completo es requerido.',
            'state.required' => 'El estado es requerido.',

            // Pension Data
            'type_pension.required' => 'El tipo de pensión es requerido.',
            'type_pension.in' => 'El tipo de pensión debe ser Jubilación, Incapacidad o Sobrevivencia.',
            'type_pay_sheet_id.required' => 'El tipo de hoja de pago es requerido.',
            'type_pay_sheet_id.exists' => 'El tipo de hoja de pago seleccionado no es válido.',
            'civil_status.required' => 'El estado civil es requerido.',
            'civil_status.in' => 'El estado civil debe ser S (Soltero), C (Casado) o V (Viudo).',
        ];
    }

    /**
     * Prepare the data for validation.
     */
    protected function prepareForValidation(): void
    {
        // Asegurar valores por defecto cuando no se envían
        $this->merge([
            'minor_child_nro' => $this->minor_child_nro ?? 0,
            'disabled_child_nro' => $this->disabled_child_nro ?? 0,
            'receive_pension_from_another_organization_status' => $this->boolean('receive_pension_from_another_organization_status'),
            'has_authorizations' => $this->boolean('has_authorizations'),
            'pension_survivor_status' => $this->boolean('pension_survivor_status'),
            'suspend_payment_status' => $this->boolean('suspend_payment_status'),
            'sex' => $this->sex ?? 'Sin asignar',
            'city' => $this->city ?? 'Sin asignar',
            'state' => $this->state ?? 'Falcon',
        ]);
    }
}
