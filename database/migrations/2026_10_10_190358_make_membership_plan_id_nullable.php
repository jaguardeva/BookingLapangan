<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('memberships', function (Blueprint $table): void {
            $table->dropForeign(['membership_plan_id']);
            $table->uuid('membership_plan_id')->nullable()->change();
            $table->foreign('membership_plan_id')->references('id')->on('membership_plans')->restrictOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('memberships', function (Blueprint $table): void {
            $table->dropForeign(['membership_plan_id']);
            $table->uuid('membership_plan_id')->nullable(false)->change();
            $table->foreign('membership_plan_id')->references('id')->on('membership_plans')->restrictOnDelete();
        });
    }
};
