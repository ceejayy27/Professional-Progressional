#!/usr/bin/env node

/**
 * Create PNG icons using macOS sips command
 * Creates solid color icons with a simple design
 */

import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');
const publicDir = join(projectRoot, 'public');

function createPNGWithSips(size, outputPath) {
  try {
    // Create a temporary SVG first
    const tempSVG = join(publicDir, `temp-${size}.svg`);
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
    writeFileSync(tempSVG, svg);
    
    // Convert SVG to PNG using sips
    execSync(`sips -s format png -z ${size} ${size} "${tempSVG}" --out "${outputPath}"`, { stdio: 'ignore' });
    
    // Clean up temp file
    try {
      const { unlinkSync } = await import('fs');
      unlinkSync(tempSVG);
    } catch (e) {
      // Ignore cleanup errors
    }
    
    return true;
  } catch (e) {
    return false;
  }
}

async function main() {
  console.log('📱 Creating PWA PNG icons...');
  
  if (!existsSync(publicDir)) {
    mkdirSync(publicDir, { recursive: true });
  }
  
  const icon192 = join(publicDir, 'pwa-192x192.png');
  const icon512 = join(publicDir, 'pwa-512x512.png');
  
  if (existsSync(icon192) && existsSync(icon512)) {
    console.log('✅ Icons already exist!');
    return;
  }
  
  console.log('Creating 192x192 icon...');
  const success192 = createPNGWithSips(192, icon192);
  
  console.log('Creating 512x512 icon...');
  const success512 = createPNGWithSips(512, icon512);
  
  if (success192 && success512) {
    console.log('✅ PNG icons created successfully!');
    console.log(`   - ${icon192}`);
    console.log(`   - ${icon512}`);
  } else {
    console.log('⚠️  Could not create PNG icons automatically.');
    console.log('   You can:');
    console.log('   1. Use the SVG files created earlier');
    console.log('   2. Convert them online at https://cloudconvert.com/svg-to-png');
    console.log('   3. Or create PNG files manually (192x192 and 512x512)');
  }
}

main().catch(console.error);

