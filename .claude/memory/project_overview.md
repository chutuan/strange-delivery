---
name: project-overview
description: "Tổng quan dự án strange-delivery — stack, trạng thái, cấu trúc monorepo"
metadata: 
  node_type: memory
  type: project
  originSessionId: 50078acd-c02b-48a4-8750-ae729c832413
---

Dự án **strange-delivery** tại `/Users/tuan/Projects/strange-delivery` — ứng dụng delivery với bidding.

## Cấu trúc monorepo

```
strange-delivery/
├── api/      ← Laravel 13 API-only (Sanctum auth, MySQL)
├── web/      ← React SPA (Vite 4 + Tailwind + React Router)
└── mobile/   ← Expo React Native (blank template, axios)
```

## Stack

| Layer    | Tech                                          | Port / URL              |
|----------|-----------------------------------------------|-------------------------|
| API      | Laravel 13, PHP 8.3, Sanctum                  | http://localhost:8000   |
| Web      | React (Vite 4), Tailwind CSS, React Router v6 | http://localhost:5173   |
| Mobile   | Expo (blank), axios                           | —                       |
| Database | MySQL                                         | DB: `strange_delivery`  |

## Business logic

- User có thể vừa là sender (đăng đơn) vừa là driver (bid đơn)
- Driver phải đăng ký driver_profile trước khi bid
- Sender đăng đơn với budget_price; driver bid giá cao/thấp hơn
- Sender chọn 1 bid → order chuyển sang in_progress, các bid còn lại bị reject
- Driver xác nhận giao → delivered
- Sender đánh giá driver (1-5 sao) sau khi delivered

## Database schema

- `users` (+phone, +avatar)
- `driver_profiles` (vehicle_type, license_plate, rating_avg, rating_count)
- `orders` (sender_id, driver_id, budget_price, final_price, status: open/in_progress/delivered/cancelled)
- `bids` (order_id, driver_id, price, status: pending/accepted/rejected; unique order+driver)
- `ratings` (order_id unique, score 1-5, comment; cập nhật rating_avg tự động)

## API endpoints (17 routes, auth:sanctum trừ login/register)

- POST /api/auth/register|login, GET /api/auth/me, POST /api/auth/logout
- POST /api/driver/register, GET|PUT /api/driver/profile
- GET /api/orders/mine, GET /api/orders/open, POST /api/orders
- GET|POST /api/orders/{id}, POST /api/orders/{id}/cancel|deliver|accept-bid/{bid}
- GET|POST /api/orders/{id}/bids
- POST /api/orders/{id}/rate

## Web UI (src/)

```
contexts/AuthContext.jsx    — login/register/logout/refreshUser
components/
  Layout.jsx                — sidebar (desktop) + bottom nav (mobile)
  ProtectedRoute.jsx
  StatusBadge.jsx           — badge màu cho status
  StarRating.jsx            — StarDisplay + StarPicker
pages/
  LoginPage.jsx
  RegisterPage.jsx
  MyOrdersPage.jsx          — danh sách đơn đã gửi (paginated)
  CreateOrderPage.jsx       — tạo đơn mới
  OrderDetailPage.jsx       — chi tiết, bids, accept bid, deliver, rate
  OpenOrdersPage.jsx        — đơn đang mở cho tài xế
  ProfilePage.jsx           — hồ sơ + driver profile
  DriverRegisterPage.jsx    — đăng ký tài xế
lib/api.js                  — axios instance, Bearer token từ localStorage
```

## Các file quan trọng

- `api/.env` — DB_CONNECTION=mysql, DB_DATABASE=strange_delivery, APP_URL=http://localhost:8000
- `api/bootstrap/app.php` — withRouting(api:...), statefulApi()
- `web/.env` — VITE_API_URL=http://localhost:8000/api
- `web/tailwind.config.js`, `web/src/index.css` — Tailwind v3 setup

## Trạng thái (2026-06-19)

Web UI và API đều hoàn chỉnh. Mobile chưa có UI. Chưa có auth middleware, CORS cụ thể cho production.

**How to apply:** Tiếp tục từ mobile UI hoặc các tính năng mới. Khi thêm endpoint mới vào API thì cần cập nhật cả web và mobile.
