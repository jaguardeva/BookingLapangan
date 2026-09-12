<?php

namespace Database\Factories;

use App\Models\WhatsappContact;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<WhatsappContact>
 */
class WhatsappContactFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => fake()->randomElement(['Customer Service', 'Booking Support']),
            'phone' => '628'.fake()->numerify('#########'),
            'description' => fake()->sentence(4),
            'is_active' => true,
            'sort_order' => fake()->numberBetween(0, 10),
        ];
    }
}
