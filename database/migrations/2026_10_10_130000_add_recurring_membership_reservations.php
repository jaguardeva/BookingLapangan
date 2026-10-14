<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('membership_plans', function (Blueprint $table): void {
            $table->unsignedSmallInteger('max_reservations')->default(5)->after('monthly_price');
        });

        Schema::table('memberships', function (Blueprint $table): void {
            $table->date('reservation_month')->nullable()->after('membership_plan_id');
            $table->unsignedBigInteger('subtotal')->default(0)->after('amount');
            $table->string('discount_type')->nullable()->after('subtotal');
            $table->unsignedBigInteger('discount_value')->default(0)->after('discount_type');
            $table->unsignedBigInteger('discount_amount')->default(0)->after('discount_value');
            $table->index(['reservation_month', 'status']);
        });

        Schema::create('membership_reservations', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->foreignUuid('membership_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('lapangan_id')->constrained()->restrictOnDelete();
            $table->unsignedTinyInteger('weekday');
            $table->string('start_time');
            $table->string('end_time');
            $table->unsignedInteger('duration_hours');
            $table->unsignedBigInteger('price_per_occurrence');
            $table->unsignedInteger('occurrence_count')->default(0);
            $table->string('status')->default('pending');
            $table->timestamps();

            $table->index(['lapangan_id', 'weekday', 'start_time', 'end_time', 'status']);
            $table->index(['membership_id', 'status']);
        });

        Schema::table('bookings', function (Blueprint $table): void {
            $table->foreignUuid('membership_id')->nullable()->after('user_id')->constrained()->nullOnDelete();
            $table->foreignUuid('membership_reservation_id')->nullable()->after('membership_id')->constrained()->nullOnDelete();
            $table->string('booking_source')->default('daily')->after('membership_reservation_id');
            $table->index(['membership_id', 'booking_date']);
            $table->index(['booking_source', 'payment_status']);
        });
    }

    public function down(): void
    {
        Schema::table('bookings', function (Blueprint $table): void {
            $table->dropConstrainedForeignId('membership_reservation_id');
            $table->dropConstrainedForeignId('membership_id');
            $table->dropColumn('booking_source');
        });

        Schema::dropIfExists('membership_reservations');

        Schema::table('memberships', function (Blueprint $table): void {
            $table->dropColumn(['reservation_month', 'subtotal', 'discount_type', 'discount_value', 'discount_amount']);
        });

        Schema::table('membership_plans', function (Blueprint $table): void {
            $table->dropColumn('max_reservations');
        });
    }
};
