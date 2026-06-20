<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('vehicles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('driver_profile_id')->constrained()->cascadeOnDelete();
            $table->enum('vehicle_type', ['motorbike', 'car', 'truck']);
            $table->string('license_plate', 20);
            $table->boolean('is_primary')->default(false);
            $table->timestamps();
        });

        // Migrate existing vehicle data from driver_profiles
        DB::table('driver_profiles')->get()->each(function ($profile) {
            DB::table('vehicles')->insert([
                'driver_profile_id' => $profile->id,
                'vehicle_type'      => $profile->vehicle_type,
                'license_plate'     => $profile->license_plate,
                'is_primary'        => true,
                'created_at'        => now(),
                'updated_at'        => now(),
            ]);
        });

        Schema::table('driver_profiles', function (Blueprint $table) {
            $table->dropColumn(['vehicle_type', 'license_plate']);
        });
    }

    public function down(): void
    {
        Schema::table('driver_profiles', function (Blueprint $table) {
            $table->enum('vehicle_type', ['motorbike', 'car', 'truck'])->after('user_id');
            $table->string('license_plate', 20)->after('vehicle_type');
        });

        // Restore data from primary vehicle
        DB::table('vehicles')->where('is_primary', true)->get()->each(function ($v) {
            DB::table('driver_profiles')->where('id', $v->driver_profile_id)->update([
                'vehicle_type'  => $v->vehicle_type,
                'license_plate' => $v->license_plate,
            ]);
        });

        Schema::dropIfExists('vehicles');
    }
};
