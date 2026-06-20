<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->boolean('is_admin')->default(false)->after('avatar');
        });

        Schema::table('driver_profiles', function (Blueprint $table) {
            $table->integer('credits')->default(0)->after('push_token');
        });
    }

    public function down(): void
    {
        Schema::table('users', fn (Blueprint $t) => $t->dropColumn('is_admin'));
        Schema::table('driver_profiles', fn (Blueprint $t) => $t->dropColumn('credits'));
    }
};
