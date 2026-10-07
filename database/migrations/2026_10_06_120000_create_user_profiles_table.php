<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('user_profiles', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->foreignUuid('user_id')->unique()->constrained('users')->cascadeOnDelete();
            $table->string('phone')->nullable();
            $table->string('avatar_path')->nullable();
            $table->string('city')->nullable();
            $table->date('date_of_birth')->nullable();
            $table->string('gender')->nullable();
            $table->json('favorite_sports')->nullable();
            $table->string('preferred_playing_time')->nullable();
            $table->timestamps();
        });

        DB::table('users')->select(['id', 'phone', 'avatar'])->orderBy('id')->each(function (object $user): void {
            DB::table('user_profiles')->insert([
                'id' => (string) Str::uuid(),
                'user_id' => $user->id,
                'phone' => $user->phone,
                'avatar_path' => $user->avatar,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        });

        Schema::table('users', function (Blueprint $table): void {
            $table->dropColumn(['phone', 'avatar']);
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table): void {
            $table->string('phone')->nullable();
            $table->string('avatar')->nullable();
        });

        DB::table('user_profiles')->select(['user_id', 'phone', 'avatar_path'])->each(function (object $profile): void {
            DB::table('users')->where('id', $profile->user_id)->update([
                'phone' => $profile->phone,
                'avatar' => $profile->avatar_path,
            ]);
        });

        Schema::dropIfExists('user_profiles');
    }
};
