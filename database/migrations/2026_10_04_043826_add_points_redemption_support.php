<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->unsignedBigInteger('points_balance')->default(0);
        });

        Schema::table('bookings', function (Blueprint $table) {
            $table->unsignedBigInteger('points_redeemed')->default(0);
        });

        Schema::create('point_transactions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('user_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('booking_id')->constrained()->cascadeOnDelete();
            $table->string('type');
            $table->unsignedBigInteger('points');
            $table->unsignedBigInteger('balance_after');
            $table->timestamps();

            $table->unique(['booking_id', 'type']);
            $table->index(['user_id', 'created_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('point_transactions');

        Schema::table('bookings', function (Blueprint $table) {
            $table->dropColumn('points_redeemed');
        });

        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('points_balance');
        });
    }
};
