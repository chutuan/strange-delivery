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
            $table->float('sender_rating_avg')->default(0)->after('avatar');
            $table->unsignedInteger('sender_rating_count')->default(0)->after('sender_rating_avg');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['sender_rating_avg', 'sender_rating_count']);
        });
    }
};
