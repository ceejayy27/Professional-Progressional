#!/usr/bin/env node

/**
 * Complete Automated Setup Script
 * Handles everything for GitHub Pages deployment
 */

import { writeFileSync, existsSync, mkdirSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');
const publicDir = join(projectRoot, 'public');

function detectRepoName() {
  try {
    const remote = execSync('git remote get-url origin', { 
      encoding: 'utf8', 
      cwd: projectRoot,
      stdio: ['pipe', 'pipe', 'ignore']
    }).trim();
    
    const match = remote.match(/(?:github\.com[/:]|git@github\.com:)([^/]+)\/([^/]+?)(?:\.git)?$/);
    if (match) {
      const username = match[1];
      const repoName = match[2];
      if (repoName === `${username}.github.io`) {
        return { basePath: '/', repoName };
      }
      return { basePath: `/${repoName}/`, repoName };
    }
  } catch (e) {
    // Git not available or not a git repo
  }
  return null;
}

function ensureIcons() {
  const icon192 = join(publicDir, 'pwa-192x192.png');
  const icon512 = join(publicDir, 'pwa-512x512.png');
  
  if (existsSync(icon192) && existsSync(icon512)) {
    return true;
  }
  
  // Try to create from existing files
  if (existsSync(icon192) && !existsSync(icon512)) {
    try {
      execSync(`sips -s format png -z 512 512 "${icon192}" --out "${icon512}"`, { stdio: 'ignore' });
      return existsSync(icon512);
    } catch (e) {
      return false;
    }
  }
  
  return false;
}

function updateViteConfig(basePath) {
  const viteConfigPath = join(projectRoot, 'vite.config.ts');
  let content = readFileSync(viteConfigPath, 'utf8');
  
  // Update the base path line
  const newBaseLine = `const base = process.env.VITE_BASE_PATH || '${basePath}'`;
  content = content.replace(/const base = process\.env\.VITE_BASE_PATH \|\| ['"]\/['"]/, newBaseLine);
  
  writeFileSync(viteConfigPath, content);
  console.log(`✅ Updated vite.config.ts with base path: ${basePath}`);
}

async function main() {
  console.log('🚀 Automated GitHub Pages Deployment Setup\n');
  console.log('This script will:');
  console.log('  1. ✅ Check/create PWA icons');
  console.log('  2. ✅ Detect repository name');
  console.log('  3. ✅ Configure base path');
  console.log('  4. ✅ Provide final deployment steps\n');
  
  // Step 1: Icons
  console.log('📱 Step 1: Checking PWA icons...');
  if (!existsSync(publicDir)) {
    mkdirSync(publicDir, { recursive: true });
  }
  
  if (ensureIcons()) {
    console.log('✅ PWA icons are ready!');
  } else {
    console.log('⚠️  Icons missing. Creating...');
    // Run the icon creation script
    try {
      execSync('node scripts/create-icons-simple.js', { cwd: projectRoot, stdio: 'inherit' });
      if (ensureIcons()) {
        console.log('✅ Icons created!');
      } else {
        console.log('⚠️  Could not create icons automatically.');
        console.log('   Please add pwa-192x192.png and pwa-512x512.png to the public folder.');
      }
    } catch (e) {
      console.log('⚠️  Could not create icons automatically.');
      console.log('   Please add pwa-192x192.png and pwa-512x512.png to the public folder.');
    }
  }
  console.log('');
  
  // Step 2: Detect repo
  console.log('🔍 Step 2: Detecting repository configuration...');
  const repoInfo = detectRepoName();
  
  if (repoInfo) {
    console.log(`✅ Detected repository: ${repoInfo.repoName}`);
    console.log(`✅ Base path: ${repoInfo.basePath}`);
    
    // Step 3: Update config
    console.log('\n⚙️  Step 3: Updating configuration...');
    updateViteConfig(repoInfo.basePath);
  } else {
    console.log('⚠️  Could not auto-detect repository.');
    console.log('   You\'ll need to manually set the base path.');
  }
  
  // Final instructions
  console.log('\n✅ Setup Complete!\n');
  console.log('📋 Final Steps (you need to do these):\n');
  console.log('1. Review the configuration:');
  if (repoInfo) {
    console.log(`   - Base path is set to: ${repoInfo.basePath}`);
    console.log(`   - If this is wrong, edit vite.config.ts line 8`);
  } else {
    console.log('   - Edit vite.config.ts line 8 to set your base path');
    console.log('   - Format: const base = \'/your-repo-name/\'');
  }
  console.log('\n2. Commit and push:');
  console.log('   git add .');
  console.log('   git commit -m "Setup GitHub Pages deployment"');
  console.log('   git push origin main');
  console.log('\n3. Enable GitHub Pages:');
  console.log('   - Go to your repo on GitHub');
  console.log('   - Settings → Pages');
  console.log('   - Source: Select "GitHub Actions"');
  console.log('   - Save');
  console.log('\n4. Wait for deployment:');
  console.log('   - Check the Actions tab');
  console.log('   - Your app will be live when deployment completes');
  if (repoInfo) {
    console.log(`   - URL: https://your-username.github.io${repoInfo.basePath}`);
  }
  console.log('\n5. Install on iOS:');
  console.log('   - Open the site in Safari');
  console.log('   - Tap Share → Add to Home Screen');
  console.log('   - Done! 🎉');
}

main().catch(console.error);

