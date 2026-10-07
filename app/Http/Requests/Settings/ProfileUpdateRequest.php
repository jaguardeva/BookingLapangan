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
            'phone' => ['nullable', 'regex:/^08[0-9]{8,13}$/'],
            'city' => ['nullable', 'string', 'max:100'],
            'date_of_birth' => ['nullable', 'date', 'before:today'],
            'gender' => ['nullable', 'in:male,female,other'],
            'favorite_sports' => ['nullable', 'array', 'max:10'],
            'favorite_sports.*' => ['string', 'max:50'],
            'preferred_playing_time' => ['nullable', 'in:morning,afternoon,evening,night'],
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
            'phone.regex' => 'Nomor telepon harus berupa angka 10–15 digit dan diawali 08.',
        ];
    }
}
