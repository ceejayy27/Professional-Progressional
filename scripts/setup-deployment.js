#!/usr/bin/env node

/**
 * Automated Deployment Setup Script
 * This script handles all the setup steps for GitHub Pages deployment
 */

import { createCanvas } from 'canvas';
import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');
const publicDir = join(projectRoot, 'public');

// Check if canvas is available, if not, use a simpler approach
let canvasAvailable = false;
try {
  const canvas = await import('canvas');
  canvasAvailable = true;
} catch (e) {
  console.log('Canvas not available, using alternative method...');
}

function createIcon(size, outputPath) {
  if (canvasAvailable) {
    const { createCanvas } = await import('canvas');
    const canvas = createCanvas(size, size);
    const ctx = canvas.getContext('2d');
    
    // Create a gradient background
    const gradient = ctx.createLinearGradient(0, 0, size, size);
    gradient.addColorStop(0, '#3b82f6'); // Blue
    gradient.addColorStop(1, '#1e40af'); // Darker blue
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
    
    // Add a simple dumbbell icon (simplified)
    ctx.fillStyle = '#ffffff';
    ctx.font = `bold ${size * 0.4}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('💪', size / 2, size / 2);
    
    const buffer = canvas.toBuffer('image/png');
    writeFileSync(outputPath, buffer);
    return true;
  } else {
    // Fallback: Create a simple SVG and convert (or just create placeholder)
    console.log(`Creating placeholder for ${size}x${size}...`);
    // For now, we'll create a note that user needs to add icons
    return false;
  }
}

async function setupIcons() {
  console.log('📱 Setting up PWA icons...');
  
  if (!existsSync(publicDir)) {
    mkdirSync(publicDir, { recursive: true });
  }
  
  const icon192 = join(publicDir, 'pwa-192x192.png');
  const icon512 = join(publicDir, 'pwa-512x512.png');
  
  if (existsSync(icon192) && existsSync(icon512)) {
    console.log('✅ Icons already exist!');
    return;
  }
  
  if (canvasAvailable) {
    console.log('Creating icon files...');
    createIcon(192, icon192);
    createIcon(512, icon512);
    console.log('✅ Icons created successfully!');
  } else {
    console.log('⚠️  Canvas package not available. Creating placeholder instructions...');
    console.log('   Please add your icon files manually:');
    console.log(`   - ${icon192}`);
    console.log(`   - ${icon512}`);
    console.log('   See public/README-icons.md for instructions');
  }
}

function detectRepoName() {
  // Try to detect from git remote
  const { execSync } = require('child_process');
  try {
    const remote = execSync('git remote get-url origin', { encoding: 'utf8', cwd: projectRoot }).trim();
    const match = remote.match(/(?:github\.com[/:]|git@github\.com:)([^/]+)\/([^/]+?)(?:\.git)?$/);
    if (match) {
      const repoName = match[2];
      if (repoName === `${match[1]}.github.io`) {
        return '/';
      }
      return `/${repoName}/`;
    }
  } catch (e) {
    // Git not available or not a git repo
  }
  return null;
}

async function main() {
  console.log('🚀 Starting automated deployment setup...\n');
  
  // Step 1: Create icons
  await setupIcons();
  console.log('');
  
  // Step 2: Detect repository name
  console.log('🔍 Detecting repository configuration...');
  const repoName = detectRepoName();
  
  if (repoName) {
    console.log(`✅ Detected repository base path: ${repoName}`);
    console.log(`\n📝 Next steps:`);
    console.log(`   1. If this is correct, you're all set!`);
    console.log(`   2. If not, set GitHub Secret: VITE_BASE_PATH = ${repoName}`);
    console.log(`   3. Or edit vite.config.ts line 8: const base = '${repoName}'`);
  } else {
    console.log('⚠️  Could not auto-detect repository name.');
    console.log(`\n📝 Manual setup needed:`);
    console.log(`   1. Determine your repo name (e.g., 'workout-app')`);
    console.log(`   2. Set GitHub Secret: VITE_BASE_PATH = /your-repo-name/`);
    console.log(`   3. Or edit vite.config.ts line 8: const base = '/your-repo-name/'`);
    console.log(`   4. If using username.github.io, use '/' as base path`);
  }
  
  console.log(`\n✅ Setup complete!`);
  console.log(`\n📋 Final steps:`);
  console.log(`   1. Commit all changes: git add . && git commit -m "Setup deployment"`);
  console.log(`   2. Push to GitHub: git push origin main`);
  console.log(`   3. Enable GitHub Pages: Settings → Pages → Source: GitHub Actions`);
  console.log(`   4. Wait for deployment in Actions tab`);
  console.log(`\n🎉 Your app will be live at: https://your-username.github.io/your-repo-name/`);
}

main().catch(console.error);

