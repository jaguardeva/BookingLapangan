<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::dropIfExists('internal_messages');
        Schema::dropIfExists('internal_conversation_participants');
        Schema::dropIfExists('internal_conversations');
        Schema::dropIfExists('chat_messages');
        Schema::dropIfExists('chat_conversations');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Chat is intentionally retired and is not recreated on rollback.
    }
};
