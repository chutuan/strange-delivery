<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class BankSetting extends Model
{
    protected $fillable = ['bank_id', 'account_number', 'account_name'];

    public static function current(): ?self
    {
        return self::first();
    }
}
