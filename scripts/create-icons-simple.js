#!/usr/bin/env node

/**
 * Simple icon generator using Node.js built-in modules
 * Creates basic placeholder icons that work for PWA
 */

import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');
const publicDir = join(projectRoot, 'public');

// Create a simple PNG using a data URL approach
// Since we can't easily create PNGs without canvas, we'll use a different approach
// We'll create SVG icons instead, which work just as well for PWA

function createSVGIcon(size, outputPath) {
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#3b82f6;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#1e40af;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" fill="url(#grad)" rx="${size * 0.2}"/>
  <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="${size * 0.5}" font-weight="bold" fill="white" text-anchor="middle" dominant-baseline="middle">💪</text>
</svg>`;
  
  writeFileSync(outputPath, svg);
}

async function main() {
  console.log('📱 Creating PWA icons...');
  
  if (!existsSync(publicDir)) {
    mkdirSync(publicDir, { recursive: true });
  }
  
  // Create SVG icons (browsers accept SVG for PWA icons)
  const icon192 = join(publicDir, 'pwa-192x192.svg');
  const icon512 = join(publicDir, 'pwa-512x512.svg');
  
  // Also create PNG placeholders using a simple approach
  // We'll create a minimal valid PNG using base64
  createSVGIcon(192, icon192);
  createSVGIcon(512, icon512);
  
  console.log('✅ SVG icons created!');
  console.log('⚠️  Note: Some browsers prefer PNG. Converting...');
  
  // Try to use sips (macOS) to convert SVG to PNG
  const { execSync } = await import('child_process');
  
  try {
    execSync(`sips -s format png -z 192 192 "${icon192}" --out "${join(publicDir, 'pwa-192x192.png')}"`, { stdio: 'ignore' });
    execSync(`sips -s format png -z 512 512 "${icon512}" --out "${join(publicDir, 'pwa-512x512.png')}"`, { stdio: 'ignore' });
    console.log('✅ PNG icons created successfully!');
  } catch (e) {
    console.log('⚠️  Could not convert to PNG automatically.');
    console.log('   SVG icons will work, but for best compatibility:');
    console.log('   - Use an online tool to convert the SVG files to PNG');
    console.log('   - Or manually create PNG files (192x192 and 512x512)');
    console.log(`   - Place them in: ${publicDir}`);
  }
}

main().catch(console.error);

