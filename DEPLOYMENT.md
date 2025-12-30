# GitHub Pages Deployment Guide

This guide will help you deploy your Workout Tracker app to GitHub Pages with full PWA support, including iOS "Add to Home Screen" functionality.

## Prerequisites

1. A GitHub account
2. Your repository pushed to GitHub
3. PWA icon files (see below)

## Step 1: Create PWA Icons

Before deploying, you need to create icon files for the PWA:

1. Create or find a square image (at least 512x512 pixels) for your app icon
2. Resize it to create two files:
   - `public/pwa-192x192.png` (192x192 pixels)
   - `public/pwa-512x512.png` (512x512 pixels)
3. Place both files in the `public` folder

**Quick Option**: Use an online tool like [PWA Asset Generator](https://github.com/onderceylan/pwa-asset-generator) or [RealFaviconGenerator](https://realfavicongenerator.net/)

## Step 2: Configure Repository Name

The app needs to know your repository name for GitHub Pages. You have two options:

### Option A: Set via GitHub Secret (Recommended)

1. Go to your GitHub repository
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Name: `VITE_BASE_PATH`
5. Value: `/your-repo-name/` (e.g., if your repo is `workout-app`, use `/workout-app/`)
6. Click **Add secret**

### Option B: Update vite.config.ts Directly

Edit `vite.config.ts` and change the base path:
```typescript
const base = process.env.VITE_BASE_PATH || '/your-repo-name/'
```

**Note**: If your repository is named exactly `username.github.io`, use `/` as the base path.

## Step 3: Enable GitHub Pages

1. Go to your GitHub repository
2. Navigate to **Settings** → **Pages**
3. Under **Source**, select **GitHub Actions**
4. Save the settings

## Step 4: Push to GitHub

1. Make sure all your changes are committed:
   ```bash
   git add .
   git commit -m "Add GitHub Pages deployment"
   ```

2. Push to the main branch:
   ```bash
   git push origin main
   ```

## Step 5: Deploy

The GitHub Actions workflow will automatically:
1. Build your app
2. Deploy it to GitHub Pages
3. Make it available at `https://your-username.github.io/your-repo-name/`

You can monitor the deployment progress in the **Actions** tab of your repository.

## Step 6: Install on Mobile

### iOS (Safari)

1. Open your deployed site in Safari on iOS
2. Tap the **Share** button (square with arrow)
3. Scroll down and tap **Add to Home Screen**
4. Customize the name if desired
5. Tap **Add**

The app will now appear on your home screen and work like a native app!

### Android (Chrome)

1. Open your deployed site in Chrome on Android
2. You may see an install banner automatically
3. Or tap the menu (three dots) → **Install app** or **Add to Home Screen**
4. Confirm the installation

## Troubleshooting

### Icons Not Showing

- Make sure icon files are in the `public` folder
- Rebuild the app: `npm run build`
- Clear browser cache

### Wrong Base Path

- Check your repository name matches the base path
- Update the `VITE_BASE_PATH` secret or `vite.config.ts`
- Rebuild and redeploy

### iOS "Add to Home Screen" Not Working

- Ensure you're using Safari (not Chrome on iOS)
- Check that the site is served over HTTPS (GitHub Pages provides this)
- Verify the manifest and meta tags are correct
- Try clearing Safari cache

### Service Worker Not Working

- Ensure the site is served over HTTPS
- Check browser console for errors
- Verify the service worker is registered (check Application tab in DevTools)

## Updating the App

Every time you push to the `main` branch, the app will automatically rebuild and deploy. The service worker will automatically update the app for users.

## Custom Domain (Optional)

If you want to use a custom domain:

1. Add a `CNAME` file to the `public` folder with your domain
2. Configure DNS settings as per GitHub Pages documentation
3. Update the base path in `vite.config.ts` to `/` if using a custom domain

## Support

For issues or questions:
- Check GitHub Actions logs in the **Actions** tab
- Review browser console for errors
- Verify all files are committed and pushed

