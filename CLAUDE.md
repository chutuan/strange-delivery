# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Strange Delivery is a Vietnamese delivery platform with three apps that share the same domain model:

- `api/` — Laravel 13 backend (PHP 8.3, SQLite, Sanctum auth)
- `web/` — React 18 + Vite frontend. **styled-components is the primary styling system** (theme in `src/styles/theme.js`, shared components in `src/styles/index.js`). Tailwind is enabled (`src/index.css`) but only used by a handful of pages authored with utility classes: `TrackOrderPage`, `NotificationsPage`, `driver/index`, and the `admin/*` pages. Design language: refined-minimal, neutral surfaces, brand orange `#F97316`.
- `mobile/` — Expo 56 / React Native app

## Commands

### API (`cd api/`)

```bash
composer run setup      # First-time: install deps, generate key, migrate, npm build
composer run dev        # Start all services concurrently (server, queue worker, pail log viewer, vite)
composer run test       # Run PHPUnit tests
php artisan test --filter OrderControllerTest   # Run a single test class
./vendor/bin/pint       # Lint / auto-fix PHP code style
php artisan migrate     # Run pending migrations
php artisan db:seed     # Seed test users and orders
```

### Web (`cd web/`)

```bash
npm run dev         # Start Vite dev server (port 5173; Playwright expects port 3000 — set in VITE_PORT or config)
npm run build       # Production build
npm run lint        # ESLint
npm run test:e2e    # Run Playwright E2E tests (requires API + web servers running)
npm run test:e2e:ui # Playwright with interactive UI
```

The web app reads `VITE_API_URL` for the backend base URL.

### Mobile (`cd mobile/`)

```bash
npm run start    # Start Expo dev server
npm run ios      # Run on iOS simulator
npm run android  # Run on Android emulator
```

In dev mode, the mobile app hardcodes `http://localhost:8000/api`. For Android emulator use `http://10.0.2.2:8000/api`. Always consult the Expo v56 docs at https://docs.expo.dev/versions/v56.0.0/ before changing Expo-specific code.

## Architecture

### Auth & User Roles

A `User` has three possible roles, not mutually exclusive:
- **Sender** — any registered user; can create orders
- **Driver** — user with a `DriverProfile` record (created via `POST /driver/register`); checked via `$user->isDriver()`
- **Admin** — `users.is_admin = true`; gated by the `is_admin` middleware on all `/admin/*` routes

Auth uses Laravel Sanctum Bearer tokens stored in `localStorage` (web) or `AsyncStorage` (mobile).

### Order Lifecycle

```
Draft → Open → InProgress → Delivered
              ↓
           Cancelled
```

Orders are identified publicly by `order_code` (format `SDxxxxxxxx`), not their database ID. The `Order` model uses `order_code` as the route key. The `recipient_name` and `recipient_phone` fields are hidden by default and only returned via `GET /orders/{order}/recipient` (accessible only to the assigned driver).

Two assignment modes controlled by `order_type`:
- **Bidding** — drivers submit bids; sender reviews and calls `POST /orders/{order}/accept-bid/{bid}`
- **Instant** — first driver to call `POST /orders/{order}/accept` gets the order

### Credit System

Drivers spend 1 credit per bid submitted. Top-up is a **two-step approval keyed by `reference_code`** (no admin-entered amounts): the driver requests an amount → a `topup`/`pending` `CreditTransaction` with a unique `reference_code` is created → the admin approves by `reference_code` (`POST /admin/credits/add`), which atomically credits the request's own amount and flips it `pending → completed` (locked, idempotent — the same transfer can't be approved twice). Balances and ledgers only count `completed` transactions. Bank account details live in `BankSettings`, set by the admin.

### Trust & Reputation Layer

The product is a **P2P / crowdsourced delivery marketplace — anyone can be a driver, senders hand packages to strangers** — so trust signals are central:

- **Driver trust profile** — `GET /drivers/{user}/profile` (authed, in-app modal) and `GET /d/{user}` (public share link, page `/d/:id`). Both reuse `DriverController::buildProfile()` and the web `DriverProfileContent` component. Returns rating avg/count, completed deliveries, member-since, vehicle types, recent reviews, per-criterion averages, verification flag, and **level**.
- **Verification badge** — admin toggles `driver_profiles.is_verified` via `POST /admin/drivers/{user}/verify`; shown in the profile and bid list.
- **Criteria ratings** — beyond the overall `score`, the sender rates `score_punctuality/attitude/care` (optional, on `ratings`); averaged on the profile.
- **Driver levels** — `App\Support\DriverLevel::for($delivered)` derives Mới/Đồng/Bạc/Vàng tiers (+ next-tier info); shown on the profile and the driver dashboard progress banner.
- **Proof of delivery** — driver attaches an optional photo when marking delivered; stored on the local disk; served publicly via `GET /track/{order}/proof` (keyed by `order_code`, no `storage:link`). `track()` exposes `has_proof`.
- **`my_bid`** — `OrderController@show` returns the viewer's own bid even when competitors' bids are hidden, so a driver who already bid sees "your bid" instead of the form.

### Saved Addresses & Scheduling

`addresses` table + `AddressController` CRUD (`/addresses`, scoped to the user, single default). The create-order form has a quick-fill picker. Orders also accept optional `pickup_time` / `required_before` (scheduling); these are naive wall-clock values — display them with `timeZone: 'UTC'` to avoid timezone shifting.

### Notifications

Notifications live in the `notifications` table; `NotificationController@index` attaches each item's `order_code` (so clicking opens `/orders/{order_code}`). The mobile app and web both poll `GET /notifications/unread-count`. The **web** `Layout` polls every 15s and, on a count increase, fetches the newest unread item to show a transient toast + a Web Audio chime. Push tokens (Expo) are registered by calling `PUT /driver/location` with a `push_token` field.

### Shared Enums

`OrderStatus` and `BidStatus` are defined both in PHP (`app/Enums/`) and mirrored in JS (`src/lib/enums.js` in both web and mobile). Keep them in sync when adding values.

### Seeded Test Credentials (all passwords: `123456`)

| Role | Email |
|------|-------|
| Driver | `driver@example.com` |
| Sender | `an@example.com`, `bich@example.com`, `cuong@example.com`, `ha@example.com` |

The seeder does **not** create an admin — set `users.is_admin = true` manually (e.g. via tinker) to test the admin area. The Playwright E2E helpers in `web/e2e/helpers.js` use these credentials.

### Web Routing

`App.jsx` splits routes into three zones:
- **Public** (no auth): `/` (landing for logged-out, redirects to the app when authed via `HomeGate`), `/login`, `/register`, `/track/:id` (public order tracking), `/d/:id` (public driver profile share link).
- **Admin** (`/admin/*`): wrapped in `<AdminLayout>`, gated by `AdminRoute` (checks `user.is_admin`). Pages: dashboard (`/admin`), users (`/admin/users`), orders (`/admin/orders` + detail `/admin/orders/:code`), credit (`/admin/credits`), bank (`/admin/bank-settings`).
- **App** (everything else): wrapped in `<ProtectedRoute>` → `<Layout>` (role-based sidebar/bottom-nav). `ProtectedRoute` redirects unauthenticated users to `/login`. The `Layout` keeps `role` in sync with the current route. Sender pages include `/orders/mine`, `/orders/create`, `/addresses`; driver pages include `/orders/open`, `/driver/dashboard`, `/top-up`.
