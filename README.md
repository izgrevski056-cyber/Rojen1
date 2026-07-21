# Rozhen 1 — Delivery Driver App

Mobile-first PWA for **Rozhen 1** distribution drivers in Bulgaria.

## Features

- **Дневен Курс** — Daily deliveries with summary at page bottom
- **Месечен Архив** — Monthly archive with clickable day details
- **Firebase Auth** — Login only (no public registration)
- **Admin Panel** — Create driver accounts, list drivers, reset passwords
- **Cloud Firestore** — Real-time sync per user account

## Roles

| Role | Access |
|------|--------|
| **Admin** | Admin tab + own delivery data (optional) |
| **Driver** | Daily run + archive for own account only |

Drivers cannot self-register. Only the admin creates accounts.

## Firebase Setup

### 1. Create project & enable services

1. [Firebase Console](https://console.firebase.google.com) → create project
2. **Authentication → Sign-in method → Email/Password** → Enable
3. **Firestore Database** → Create (production mode)
4. **Project settings → Web app** → copy config into `js/firebase-config.js`

### 2. Configure admin email

In **both** files, set your real admin email:

- `js/firebase-config.js` → `ADMIN_EMAILS`
- `firestore.rules` → bootstrap email in `allow create` rule

### 3. Create admin Auth user

Firebase Console → **Authentication → Users → Add user**

Use the same email as in `ADMIN_EMAILS` and set a password.

On first login, the app creates the admin Firestore profile automatically.

### 4. Deploy rules & functions

```bash
npm install -g firebase-tools
firebase login
firebase deploy --only firestore:rules,functions
```

Password reset requires the **`adminResetPassword`** Cloud Function.

### 5. Authorized domains

Add your hosting domain under **Authentication → Settings → Authorized domains**.

## Admin workflow

1. Log in with your admin account
2. Open the **Админ** tab
3. **Създай шофьор** — enter name, email, password
4. Share credentials with the driver
5. **Смени парола** / **Деактивирай** as needed

## Firestore structure

```
users/{uid}
  role: "admin" | "driver"
  email, displayName, settings, disabled, createdAt

users/{uid}/days/{YYYY-MM-DD}
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

- Disable public registration is enforced in app logic (`ensureUserProfile`)
- Firestore rules prevent drivers from reading other users' data
- Only admins can create driver profiles or list all drivers
- Password changes for other users require the Cloud Function (Admin SDK)
