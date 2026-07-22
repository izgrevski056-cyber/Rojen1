# Rozhen 1 — Delivery Driver App

Mobile-first PWA for **Rozhen 1** distribution drivers in Bulgaria.

## Features

- **Дневен Курс** — Daily deliveries with summary at page bottom
- **Месечен Архив** — Monthly archive with clickable day details
- **Username + password login** — Select user from list (no email)
- **Admin Panel** — Create drivers, reset passwords, enable/disable accounts
- **Firebase Realtime Database** — Real-time sync per user account (free Spark plan)

## Roles

| Role | Access |
|------|--------|
| **Admin** (`martin`) | Admin tab + own delivery data |
| **Driver** | Daily run + archive for own account only |

Drivers cannot self-register. Only the admin creates accounts.

## Default admin login

- **Username:** `martin`
- **Password:** `rozhen1` (change after first login)

## Firebase Setup

### 1. Create project & enable Realtime Database

1. [Firebase Console](https://console.firebase.google.com) → project **rozhen1**
2. **Build → Realtime Database** → **Create Database**
3. Choose **Test mode** (or production with rules below)
4. Region: closest to Bulgaria (e.g. `europe-west1`)
5. **Project settings → Web app** → copy config into `js/firebase-config.js` (include `databaseURL`)

### 2. Deploy database rules

```bash
npm install -g firebase-tools
firebase login
firebase deploy --only database
```

Rules file: `database.rules.json`

### 3. Authorized domains

Add your hosting domain under **Authentication → Settings → Authorized domains** (if using Firebase Auth later). For GitHub Pages add `rojen1.github.io`.

## Admin workflow

1. Log in as **martin**
2. Open the **Админ** tab
3. **Създай шофьор** — username, display name, password
4. Share credentials with the driver
5. **Смени парола** / **Деактивирай** as needed

## Realtime Database structure

```
accounts/
  {username}/
    username, displayName, passwordHash, role, settings, disabled, createdAt
    days/
      {YYYY-MM-DD}/
        deliveries: [...]
        updatedAt
```

## Quick Start (local)

```bash
npx serve .
```

## Deploy

- **GitHub Pages** — push to `main` (see `.github/workflows/deploy-pages.yml`)
- **Netlify** — import repo (`netlify.toml` included)

## Security notes

- Passwords stored as SHA-256 hash in Realtime Database
- Session stored in `sessionStorage` on the device
- Current rules allow open read/write (suitable for small internal team)
- Change default admin password after first login
