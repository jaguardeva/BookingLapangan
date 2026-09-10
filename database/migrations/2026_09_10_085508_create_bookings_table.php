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
        Schema::create('bookings', function (Blueprint $table) {
            $table->id();
            $table->string('booking_code')->unique();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('lapangan_id')->constrained('lapangans')->cascadeOnDelete();
            $table->date('booking_date');
            $table->string('start_time'); // HH:mm
            $table->string('end_time');   // HH:mm
            $table->unsignedInteger('duration_hours')->default(1);
            $table->unsignedBigInteger('base_price');
            $table->unsignedSmallInteger('validation_code')->default(0); // 3 digit (e.g. 145)
            $table->unsignedBigInteger('total_price');
            $table->string('payment_method')->default('transfer'); // cash, transfer
            $table->string('payment_status')->default('pending');  // pending, pending_validation, approved, rejected, cancelled
            $table->string('customer_name');
            $table->string('customer_phone');
            $table->text('notes')->nullable();
            $table->unsignedSmallInteger('user_submitted_code')->nullable();
            $table->text('rejection_reason')->nullable();
            $table->foreignId('validated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('validated_at')->nullable();
            $table->timestamp('payment_deadline');
            $table->timestamp('cancelled_at')->nullable();
            $table->timestamps();

            $table->index(['lapangan_id', 'booking_date', 'payment_status']);
            $table->index(['user_id', 'payment_status']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('bookings');
    }
};
