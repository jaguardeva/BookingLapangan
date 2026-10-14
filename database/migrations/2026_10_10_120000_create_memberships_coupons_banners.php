<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('membership_plans', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->string('name');
            $table->text('description')->nullable();
            $table->unsignedBigInteger('monthly_price');
            $table->boolean('is_active')->default(true)->index();
            $table->timestamps();
        });

        Schema::create('memberships', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->foreignUuid('user_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('membership_plan_id')->constrained()->restrictOnDelete();
            $table->unsignedBigInteger('amount');
            $table->string('status')->default('pending');
            $table->string('payment_method')->default('transfer');
            $table->string('payment_status')->default('pending');
            $table->unsignedSmallInteger('validation_code')->default(0);
            $table->unsignedSmallInteger('user_submitted_code')->nullable();
            $table->text('rejection_reason')->nullable();
            $table->foreignUuid('validated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('validated_at')->nullable();
            $table->timestamp('payment_deadline')->nullable();
            $table->timestamp('starts_at')->nullable();
            $table->timestamp('ends_at')->nullable();
            $table->timestamp('approved_at')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'status', 'ends_at']);
            $table->index(['payment_status', 'payment_deadline']);
        });

        Schema::create('coupons', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->string('code')->unique();
            $table->string('discount_type');
            $table->decimal('discount_value', 12, 2);
            $table->unsignedBigInteger('minimum_order_amount')->default(0);
            $table->unsignedBigInteger('maximum_discount_amount')->nullable();
            $table->unsignedInteger('usage_limit')->nullable();
            $table->unsignedInteger('per_user_limit')->nullable();
            $table->unsignedInteger('used_count')->default(0);
            $table->timestamp('starts_at')->nullable();
            $table->timestamp('ends_at')->nullable();
            $table->boolean('is_active')->default(true)->index();
            $table->timestamps();

            $table->index(['is_active', 'starts_at', 'ends_at']);
        });

        Schema::create('banners', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->string('title');
            $table->text('body')->nullable();
            $table->string('image_path');
            $table->string('alt_text')->nullable();
            $table->string('link_url')->nullable();
            $table->string('placement')->default('home')->index();
            $table->unsignedInteger('sort_order')->default(0)->index();
            $table->boolean('is_active')->default(true)->index();
            $table->timestamp('starts_at')->nullable();
            $table->timestamp('ends_at')->nullable();
            $table->foreignUuid('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignUuid('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });

        Schema::create('coupon_redemptions', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->foreignUuid('coupon_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('user_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('booking_id')->unique()->constrained()->cascadeOnDelete();
            $table->unsignedBigInteger('discount_amount');
            $table->string('status')->default('reserved');
            $table->timestamp('reserved_at');
            $table->timestamp('consumed_at')->nullable();
            $table->timestamp('released_at')->nullable();
            $table->timestamps();

            $table->index(['coupon_id', 'user_id', 'status']);
        });

        Schema::table('bookings', function (Blueprint $table): void {
            $table->foreignUuid('coupon_id')->nullable()->after('base_price')->constrained('coupons')->nullOnDelete();
            $table->unsignedBigInteger('discount_amount')->default(0)->after('coupon_id');
        });
    }

    public function down(): void
    {
        Schema::table('bookings', function (Blueprint $table): void {
            $table->dropConstrainedForeignId('coupon_id');
            $table->dropColumn('discount_amount');
        });

        Schema::dropIfExists('coupon_redemptions');
        Schema::dropIfExists('banners');
        Schema::dropIfExists('coupons');
        Schema::dropIfExists('memberships');
        Schema::dropIfExists('membership_plans');
    }
};
