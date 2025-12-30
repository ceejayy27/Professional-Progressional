# PWA Icons Setup

This folder needs to contain the PWA icon files for the app to be installable.

## Required Files

You need to create two icon files:

1. **pwa-192x192.png** - 192x192 pixels
2. **pwa-512x512.png** - 512x512 pixels

## How to Create Icons

### Option 1: Use an Online Tool
1. Go to [PWA Asset Generator](https://github.com/onderceylan/pwa-asset-generator)
2. Upload a square image (at least 512x512 pixels)
3. Download the generated icons
4. Place `pwa-192x192.png` and `pwa-512x512.png` in this `public` folder

### Option 2: Use RealFaviconGenerator
1. Visit [RealFaviconGenerator](https://realfavicongenerator.net/)
2. Upload your icon
3. Configure settings
4. Download and extract the icons to this folder

### Option 3: Create Manually
1. Create a square image (512x512 minimum)
2. Use an image editor to resize:
   - 192x192 pixels → save as `pwa-192x192.png`
   - 512x512 pixels → save as `pwa-512x512.png`
3. Place both files in this `public` folder

## Icon Design Tips

- Use a simple, recognizable design
- Ensure good contrast
- Test on both light and dark backgrounds
- The icon should be readable at small sizes

## After Adding Icons

Once you've added the icon files, rebuild the app:
```bash
npm run build
```

The icons will be automatically included in the build and the PWA will be fully functional.

