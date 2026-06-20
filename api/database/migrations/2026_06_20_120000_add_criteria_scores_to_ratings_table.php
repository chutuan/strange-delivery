<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('ratings', function (Blueprint $table) {
            $table->tinyInteger('score_punctuality')->unsigned()->nullable()->after('comment');
            $table->tinyInteger('score_attitude')->unsigned()->nullable()->after('score_punctuality');
            $table->tinyInteger('score_care')->unsigned()->nullable()->after('score_attitude');
        });
    }

    public function down(): void
    {
        Schema::table('ratings', function (Blueprint $table) {
            $table->dropColumn(['score_punctuality', 'score_attitude', 'score_care']);
        });
    }
};
