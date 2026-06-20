<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * `score` holds the sender's rating of the driver. When a driver rates the
     * sender first, the rating row is created with only `driver_score` set, so
     * `score` must be nullable — otherwise the insert hits a NOT NULL violation.
     */
    public function up(): void
    {
        Schema::table('ratings', function (Blueprint $table) {
            $table->tinyInteger('score')->unsigned()->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('ratings', function (Blueprint $table) {
            $table->tinyInteger('score')->unsigned()->nullable(false)->change();
        });
    }
};
