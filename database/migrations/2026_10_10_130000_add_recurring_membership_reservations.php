<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        $this->addMembershipColumns();
        $this->createOrRepairMembershipReservationsTable();
        $this->addBookingColumns();
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
    }

    private function addMembershipColumns(): void
    {
        if (! Schema::hasColumn('memberships', 'reservation_month')) {
            Schema::table('memberships', function (Blueprint $table): void {
                $table->date('reservation_month')->nullable()->after('membership_plan_id');
            });
        }

        if (! Schema::hasColumn('memberships', 'subtotal')) {
            Schema::table('memberships', function (Blueprint $table): void {
                $table->unsignedBigInteger('subtotal')->default(0)->after('amount');
            });
        }

        if (! Schema::hasColumn('memberships', 'discount_type')) {
            Schema::table('memberships', function (Blueprint $table): void {
                $table->string('discount_type')->nullable()->after('subtotal');
            });
        }

        if (! Schema::hasColumn('memberships', 'discount_value')) {
            Schema::table('memberships', function (Blueprint $table): void {
                $table->unsignedBigInteger('discount_value')->default(0)->after('discount_type');
            });
        }

        if (! Schema::hasColumn('memberships', 'discount_amount')) {
            Schema::table('memberships', function (Blueprint $table): void {
                $table->unsignedBigInteger('discount_amount')->default(0)->after('discount_value');
            });
        }

        if (! $this->hasIndex('memberships', 'memberships_reservation_month_status_index')) {
            Schema::table('memberships', function (Blueprint $table): void {
                $table->index(['reservation_month', 'status'], 'memberships_reservation_month_status_index');
            });
        }
    }

    private function createOrRepairMembershipReservationsTable(): void
    {
        if (! Schema::hasTable('membership_reservations')) {
            Schema::create('membership_reservations', function (Blueprint $table): void {
                $table->uuid('id')->primary();
                $table->foreignUuid('membership_id')->constrained()->cascadeOnDelete();
                $table->foreignUuid('lapangan_id')->constrained()->restrictOnDelete();
                $table->unsignedTinyInteger('weekday');
                $table->string('start_time', 5);
                $table->string('end_time', 5);
                $table->unsignedInteger('duration_hours');
                $table->unsignedBigInteger('price_per_occurrence');
                $table->unsignedInteger('occurrence_count')->default(0);
                $table->string('status', 32)->default('pending');
                $table->timestamps();
            });
        } else {
            Schema::table('membership_reservations', function (Blueprint $table): void {
                $table->string('start_time', 5)->change();
                $table->string('end_time', 5)->change();
                $table->string('status', 32)->default('pending')->change();
            });
        }

        if (! $this->hasIndex('membership_reservations', 'mr_lapangan_weekday_time_status_idx')) {
            Schema::table('membership_reservations', function (Blueprint $table): void {
                $table->index(
                    ['lapangan_id', 'weekday', 'start_time', 'end_time', 'status'],
                    'mr_lapangan_weekday_time_status_idx',
                );
            });
        }

        if (! $this->hasIndex('membership_reservations', 'membership_reservations_membership_id_status_index')) {
            Schema::table('membership_reservations', function (Blueprint $table): void {
                $table->index(['membership_id', 'status'], 'membership_reservations_membership_id_status_index');
            });
        }
    }

    private function addBookingColumns(): void
    {
        if (! Schema::hasColumn('bookings', 'membership_id')) {
            Schema::table('bookings', function (Blueprint $table): void {
                $table->foreignUuid('membership_id')->nullable()->after('user_id')->constrained()->nullOnDelete();
            });
        }

        if (! Schema::hasColumn('bookings', 'membership_reservation_id')) {
            Schema::table('bookings', function (Blueprint $table): void {
                $table->foreignUuid('membership_reservation_id')->nullable()->after('membership_id')->constrained()->nullOnDelete();
            });
        }

        if (! Schema::hasColumn('bookings', 'booking_source')) {
            Schema::table('bookings', function (Blueprint $table): void {
                $table->string('booking_source')->default('daily')->after('membership_reservation_id');
            });
        }

        if (! $this->hasIndex('bookings', 'bookings_membership_id_booking_date_index')) {
            Schema::table('bookings', function (Blueprint $table): void {
                $table->index(['membership_id', 'booking_date'], 'bookings_membership_id_booking_date_index');
            });
        }

        if (! $this->hasIndex('bookings', 'bookings_booking_source_payment_status_index')) {
            Schema::table('bookings', function (Blueprint $table): void {
                $table->index(['booking_source', 'payment_status'], 'bookings_booking_source_payment_status_index');
            });
        }
    }

    private function hasIndex(string $table, string $index): bool
    {
        foreach (Schema::getIndexes($table) as $definition) {
            if (($definition['name'] ?? null) === $index) {
                return true;
            }
        }

        return false;
    }
};
