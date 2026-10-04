<?php

namespace App\Http\Requests\Settings;

use App\Concerns\ProfileValidationRules;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class ProfileUpdateRequest extends FormRequest
{
    use ProfileValidationRules;

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        if ($this->user()->isAdmin() || $this->user()->isSuperAdmin()) {
            return $this->profileRules($this->user()->id);
        }

        return [
            'name' => $this->nameRules(),
            'email' => ['prohibited'],
        ];
    }

    /**
     * Get localized validation messages for locked profile fields.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'email.prohibited' => 'Alamat email tidak dapat diubah sendiri. Silakan hubungi admin atau dukungan.',
        ];
    }
}
