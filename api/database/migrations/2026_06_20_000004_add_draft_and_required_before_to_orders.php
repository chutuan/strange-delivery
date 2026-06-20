<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->timestamp('required_before')->nullable()->after('pickup_time');
        });

        // SQLite (tests) uses TEXT and doesn't enforce enum, so skip
        if (DB::getDriverName() !== 'sqlite') {
            DB::statement("ALTER TABLE orders MODIFY COLUMN status ENUM('draft','open','in_progress','delivered','cancelled') DEFAULT 'draft'");
        }
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropColumn('required_before');
        });

        if (DB::getDriverName() !== 'sqlite') {
            DB::statement("ALTER TABLE orders MODIFY COLUMN status ENUM('open','in_progress','delivered','cancelled') DEFAULT 'open'");
        }
    }
};
