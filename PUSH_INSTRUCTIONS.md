# 🚀 Push to GitHub - Quick Guide

I've created an automated script to handle the push for you!

## Option 1: Interactive Script (Recommended)

Just run:

```bash
npm run push:github
```

The script will:
1. ✅ Prompt you for your GitHub repository URL
2. ✅ Auto-detect your repository name
3. ✅ Update the base path configuration
4. ✅ Add the remote
5. ✅ Push everything to GitHub

## Option 2: Non-Interactive (Faster)

If you already know your repository URL:

```bash
npm run push:github -- https://github.com/your-username/your-repo-name
```

Or:

```bash
npm run push:github -- git@github.com:your-username/your-repo-name.git
```

## What the Script Does

1. **Detects Repository Info** - Extracts username and repo name from URL
2. **Updates Configuration** - Automatically sets the correct base path in `vite.config.ts`
3. **Adds Remote** - Configures git remote
4. **Pushes Code** - Pushes all your code to GitHub

## After Pushing

The script will show you:
- ✅ Your app's URL
- ✅ Link to enable GitHub Pages
- ✅ Next steps

Then just:
1. Go to the GitHub Pages settings link shown
2. Select "GitHub Actions" as the source
3. Save
4. Wait for deployment (check Actions tab)

## Manual Alternative

If the script doesn't work, you can do it manually:

```bash
# Add remote (replace with your repo URL)
git remote add origin https://github.com/your-username/your-repo-name.git

# Push
git push -u origin main
```

Then manually update `vite.config.ts` line 8:
```typescript
const base = '/your-repo-name/'  // Replace with your repo name
```

---

**Ready?** Just run `npm run push:github` and follow the prompts! 🎉

