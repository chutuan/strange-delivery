<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('driver_profiles', function (Blueprint $table) {
            $table->double('current_lat')->nullable()->after('is_active');
            $table->double('current_lng')->nullable()->after('current_lat');
            $table->unsignedTinyInteger('notification_radius_km')->default(3)->after('current_lng');
            $table->string('push_token')->nullable()->after('notification_radius_km');
        });
    }

    public function down(): void
    {
        Schema::table('driver_profiles', function (Blueprint $table) {
            $table->dropColumn(['current_lat', 'current_lng', 'notification_radius_km', 'push_token']);
        });
    }
};
