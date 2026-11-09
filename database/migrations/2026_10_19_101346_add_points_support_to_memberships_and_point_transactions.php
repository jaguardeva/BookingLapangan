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
        Schema::table('memberships', function (Blueprint $table): void {
            if (! Schema::hasColumn('memberships', 'points_redeemed')) {
                $table->unsignedBigInteger('points_redeemed')->default(0)->after('validation_code');
            }
        });

        Schema::table('point_transactions', function (Blueprint $table): void {
            $table->foreignUuid('booking_id')->nullable()->change();

            if (! Schema::hasColumn('point_transactions', 'membership_id')) {
                $table->foreignUuid('membership_id')->nullable()->after('booking_id')->constrained('memberships')->cascadeOnDelete();
                $table->index(['membership_id', 'type']);
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('point_transactions', function (Blueprint $table): void {
            if (Schema::hasColumn('point_transactions', 'membership_id')) {
                $table->dropConstrainedForeignId('membership_id');
            }
            $table->foreignUuid('booking_id')->nullable(false)->change();
        });

        Schema::table('memberships', function (Blueprint $table): void {
            if (Schema::hasColumn('memberships', 'points_redeemed')) {
                $table->dropColumn('points_redeemed');
            }
        });
    }
};
