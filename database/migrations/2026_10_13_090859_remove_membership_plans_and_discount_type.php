<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        DB::table('bookings')
            ->whereIn('membership_id', DB::table('memberships')->whereNotNull('membership_plan_id')->select('id'))
            ->delete();

        DB::table('memberships')->whereNotNull('membership_plan_id')->delete();

        Schema::table('memberships', function (Blueprint $table): void {
            $table->dropForeign(['membership_plan_id']);
            $table->dropColumn(['membership_plan_id', 'discount_type']);
        });

        Schema::dropIfExists('membership_plans');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        throw new RuntimeException('This destructive migration cannot be rolled back safely.');
    }
};
