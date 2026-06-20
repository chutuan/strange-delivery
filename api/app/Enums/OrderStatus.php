<?php

namespace App\Enums;

enum OrderStatus: string
{
    case Draft = 'draft';
    case Open = 'open';
    case InProgress = 'in_progress';
    case Delivered = 'delivered';
    case Cancelled = 'cancelled';
}
