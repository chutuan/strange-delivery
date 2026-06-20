# Deploy — web (VPS + Nginx)

The web app is a static Vite SPA: build it once, serve the `dist/` folder with
Nginx. `VITE_API_URL` is baked in **at build time**, so it must point at the
production API before you run `npm run build`.

## 1. Build (locally or on a CI runner — needs Node ≥ 20)

```bash
cd web
echo "VITE_API_URL=https://api.your-domain.com/api" > .env.production.local
npm ci
npm run build          # → web/dist/
```

> Or pass it inline: `VITE_API_URL=https://api.your-domain.com/api npm run build`.
> Use `/api` (same-origin via the Nginx proxy block) to avoid CORS entirely.

## 2. Ship `dist/` to the server

```bash
rsync -avz --delete web/dist/ user@server:/var/www/strange-delivery/dist/
```

## 3. Nginx

```bash
sudo cp web/nginx.conf /etc/nginx/sites-available/strange-delivery
sudo ln -s /etc/nginx/sites-available/strange-delivery /etc/nginx/sites-enabled/
# edit server_name + root in that file
sudo nginx -t && sudo systemctl reload nginx
```

The config already does the **SPA fallback** (`try_files … /index.html`), gzip,
long-cache for hashed `/assets/`, and no-cache for `index.html`.

## 4. HTTPS

```bash
sudo certbot --nginx -d your-domain.com
```

## 5. Backend checklist (the SPA is useless without it)

- API reachable at the `VITE_API_URL` you built with.
- **CORS**: the API allows the web origin. The current default is permissive
  (`*`), which works; tighten to your domain for production if desired. If you
  use the Nginx `/api` proxy (same-origin), CORS is moot.
- API env: `APP_ENV=production`, `APP_DEBUG=false` (else stack traces leak),
  real `APP_URL`, a persistent `storage/` for proof photos, and a backed-up DB.
- Auth is Bearer-token (localStorage) — no cookie/session/CSRF domain config
  needed on the SPA side.

## Redeploy

Re-run steps 1–2. Filenames are content-hashed so browsers pick up new assets
immediately; `index.html` is served no-cache so the new asset names load at once.
