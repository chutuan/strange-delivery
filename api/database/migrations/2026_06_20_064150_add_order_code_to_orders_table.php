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
        if (! Schema::hasColumn('orders', 'order_code')) {
            Schema::table('orders', function (Blueprint $table) {
                $table->string('order_code', 12)->nullable()->unique()->after('id');
            });
        }

        // Backfill existing rows that have no code yet
        \DB::table('orders')->whereNull('order_code')->orderBy('id')->each(function ($order) {
            do {
                $code = 'SD' . strtoupper(\Illuminate\Support\Str::random(8));
            } while (\DB::table('orders')->where('order_code', $code)->exists());
            \DB::table('orders')->where('id', $order->id)->update(['order_code' => $code]);
        });
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropColumn('order_code');
        });
    }
};
