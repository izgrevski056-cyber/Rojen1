# Rozhen 1 — Delivery Driver App

Mobile-first PWA for tracking daily deliveries, turnover, and salary calculations for **Rozhen 1** distribution drivers in Bulgaria.

## Features

- **Дневен Курс** — Add delivery stops, mark as delivered (green strike-through), live summary bar
- **Месечен Архив** — Excel-style monthly table with totals and final payout (ЗА ПЛАЩАНЕ)
- **Настройки** — Configurable bonus %, daily allowance (надник), monthly voucher
- **Offline** — localStorage persistence + service worker caching

## Quick Start

Serve the folder over HTTP (required for ES modules and service worker):

```bash
# Python
python -m http.server 8080

# Node (npx)
npx serve .
```

Open `http://localhost:8080` on your phone or desktop.

## Default Settings

| Setting | Default |
|---------|---------|
| Bonus % | 0.25% of daily turnover |
| Daily allowance (Надник) | 33.16 € |
| Monthly voucher | 100 € |

**Daily total** = Bonus + Allowance  
**Monthly payout** = Sum of daily totals + Voucher

## Project Structure

```
├── index.html          # App shell & views
├── css/styles.css      # Custom styles (toggle, animations)
├── js/
│   ├── app.js          # Entry point, navigation
│   ├── storage.js      # localStorage (Firebase-ready adapter)
│   ├── calculations.js # Turnover & salary math
│   └── views/
│       ├── daily.js    # Daily run screen
│       ├── archive.js  # Monthly archive
│       └── settings.js # Settings modal
├── manifest.json       # PWA manifest
├── service-worker.js   # Offline cache
└── icons/              # App icons
```

## Firebase Migration

Replace the storage adapter in `js/storage.js`:

```javascript
import { setAdapter } from './storage.js';
import { firebaseAdapter } from './firebase.js';

setAdapter(firebaseAdapter);
```

Implement `load()` and `save(data)` on the adapter to sync with Firestore.

## Install as PWA

On Android Chrome: Menu → "Add to Home screen"  
On iOS Safari: Share → "Add to Home Screen"

## Deploy

### GitHub Pages (automatic)

Every push to `main` triggers the GitHub Actions workflow (`.github/workflows/deploy-pages.yml`) and publishes the site.

1. In the repo on GitHub: **Settings → Pages → Build and deployment → Source: GitHub Actions**
2. After the first successful workflow run, the live URL appears under **Settings → Pages** (typically `https://<username>.github.io/rozhen1/`)

### Netlify (optional)

1. Go to [app.netlify.com](https://app.netlify.com) → **Add new site → Import an existing project**
2. Connect the GitHub repo
3. Netlify reads `netlify.toml` automatically — no build command needed
4. Deploy
