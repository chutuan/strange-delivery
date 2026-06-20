# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Strange Delivery is a Vietnamese delivery platform with three apps that share the same domain model:

- `api/` — Laravel 13 backend (PHP 8.3, SQLite, Sanctum auth)
- `web/` — React 18 + Vite + Tailwind CSS frontend
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

Drivers spend 1 credit per bid submitted. Credits are topped up via a VietQR bank transfer flow: driver requests top-up → admin sees pending requests → admin approves and adds credits. Bank account details are configured in `BankSettings` by the admin.

### Notifications

The API stores notifications in the `notifications` table. The mobile app polls `GET /notifications/unread-count` every 30 seconds. Push tokens (Expo) are registered by calling `PUT /driver/location` with a `push_token` field — there is no dedicated push-token registration endpoint.

### Shared Enums

`OrderStatus` and `BidStatus` are defined both in PHP (`app/Enums/`) and mirrored in JS (`src/lib/enums.js` in both web and mobile). Keep them in sync when adding values.

### Seeded Test Credentials (all passwords: `123456`)

| Role | Email |
|------|-------|
| Driver | `driver@example.com` |
| Sender | `an@example.com`, `bich@example.com`, `cuong@example.com`, `ha@example.com` |

The Playwright E2E helpers in `web/e2e/helpers.js` use these credentials.

### Web Routing

The web app wraps all authenticated pages in `<Layout>` with role-based navigation. The `ProtectedRoute` component redirects unauthenticated users to `/login`. Admin pages use a separate `<AdminLayout>` and are guarded by checking `user.is_admin`.
