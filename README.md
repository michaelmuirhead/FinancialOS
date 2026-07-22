# Our Financial OS — PWA

Installable, responsive household finance dashboard for iPhone, iPad, and desktop.

## Included
- Responsive desktop, iPad, and iPhone layouts
- iPhone bottom navigation
- PWA manifest and app icons
- Offline service worker caching
- Install prompt on supported browsers
- Apple home-screen metadata
- Existing dashboard modules and sample data

## Run locally
```bash
npm install
npm run dev
```

## Build
```bash
npm run build
```
The deployable site is generated in `dist/`.

## Deploy
Upload the contents of `dist/` to Vercel, Netlify, Cloudflare Pages, or another HTTPS static host.

## Install on iPhone or iPad
1. Open the deployed URL in Safari.
2. Tap the Share button.
3. Choose **Add to Home Screen**.
4. Tap **Add**.

## Current scope
This version uses sample data. It does not yet include authentication, cloud synchronization, bank connections, or encrypted document storage.
