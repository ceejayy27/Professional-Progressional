# Quick Start - GitHub Pages Deployment

## Before You Deploy

1. **Add PWA Icons** (Required)
   - Create `public/pwa-192x192.png` (192x192 pixels)
   - Create `public/pwa-512x512.png` (512x512 pixels)
   - See `public/README-icons.md` for detailed instructions

2. **Set Repository Base Path**
   - If your repo is `username/workout-app`, you need base path `/workout-app/`
   - Option A: Set GitHub Secret `VITE_BASE_PATH` = `/workout-app/`
   - Option B: Edit `vite.config.ts` line 7: `const base = '/workout-app/'`
   - If repo is `username.github.io`, use `/`

## Deploy Steps

1. **Commit all changes:**
   ```bash
   git add .
   git commit -m "Setup GitHub Pages deployment"
   ```

2. **Push to GitHub:**
   ```bash
   git push origin main
   ```

3. **Enable GitHub Pages:**
   - Go to repo Settings → Pages
   - Source: Select "GitHub Actions"
   - Save

4. **Wait for deployment:**
   - Check Actions tab for build progress
   - Your app will be live at: `https://username.github.io/repo-name/`

## Install on iOS

1. Open the deployed site in **Safari** (not Chrome)
2. Tap **Share** button (square with arrow)
3. Tap **Add to Home Screen**
4. Tap **Add**

The app will work offline and appear like a native app!

## Full Documentation

See `DEPLOYMENT.md` for complete instructions and troubleshooting.

