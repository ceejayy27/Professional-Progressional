#!/usr/bin/env node

/**
 * Helper script to push to GitHub
 * Prompts for repository URL and handles the push
 */

import { execSync } from 'child_process';
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import readline from 'readline';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

function extractRepoInfo(url) {
  // Handle various URL formats:
  // https://github.com/username/repo-name.git
  // https://github.com/username/repo-name
  // git@github.com:username/repo-name.git
  // git@github.com:username/repo-name
  
  const patterns = [
    /(?:github\.com[/:]|git@github\.com:)([^/]+)\/([^/]+?)(?:\.git)?$/,
    /github\.com\/([^/]+)\/([^/]+)/
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      return {
        username: match[1],
        repoName: match[2],
        fullName: `${match[1]}/${match[2]}`
      };
    }
  }
  
  return null;
}

function updateViteConfig(repoName, username) {
  const viteConfigPath = join(projectRoot, 'vite.config.ts');
  let content = readFileSync(viteConfigPath, 'utf8');
  
  // Determine base path
  let basePath = '/';
  if (repoName !== `${username}.github.io`) {
    basePath = `/${repoName}/`;
  }
  
  // Update the base path line
  const newBaseLine = `const base = process.env.VITE_BASE_PATH || '${basePath}'`;
  content = content.replace(/const base = process\.env\.VITE_BASE_PATH \|\| ['"]\/['"]/, newBaseLine);
  
  writeFileSync(viteConfigPath, content);
  console.log(`✅ Updated vite.config.ts with base path: ${basePath}`);
  
  return basePath;
}

async function main() {
  console.log('🚀 GitHub Push Helper\n');
  
  // Check for command line argument
  const repoUrlArg = process.argv[2];
  
  // Check if already has remote
  try {
    const existingRemote = execSync('git remote get-url origin', { 
      encoding: 'utf8', 
      cwd: projectRoot,
      stdio: ['pipe', 'pipe', 'ignore']
    }).trim();
    
    console.log(`📦 Found existing remote: ${existingRemote}`);
    const useExisting = await question('Use this remote? (y/n): ');
    
    if (useExisting.toLowerCase() === 'y' || useExisting.toLowerCase() === 'yes') {
      const repoInfo = extractRepoInfo(existingRemote);
      if (repoInfo) {
        console.log(`\n✅ Repository: ${repoInfo.fullName}`);
        const basePath = updateViteConfig(repoInfo.repoName, repoInfo.username);
        
        // Commit vite config change if needed
        try {
          execSync('git add vite.config.ts', { cwd: projectRoot, stdio: 'ignore' });
          execSync('git commit -m "Update base path for GitHub Pages"', { 
            cwd: projectRoot, 
            stdio: 'ignore' 
          });
        } catch (e) {
          // No changes or already committed
        }
        
        console.log('\n📤 Pushing to GitHub...');
        try {
          execSync('git push -u origin main', { cwd: projectRoot, stdio: 'inherit' });
          console.log('\n✅ Successfully pushed to GitHub!');
          console.log(`\n🌐 Your app will be available at:`);
          console.log(`   https://${repoInfo.username}.github.io${basePath}`);
          console.log(`\n📋 Next step: Enable GitHub Pages`);
          console.log(`   1. Go to: https://github.com/${repoInfo.fullName}/settings/pages`);
          console.log(`   2. Under "Source", select "GitHub Actions"`);
          console.log(`   3. Save`);
          console.log(`\n🎉 That's it! Your app will deploy automatically.`);
        } catch (e) {
          console.error('\n❌ Error pushing to GitHub. Make sure you have:');
          console.error('   - Internet connection');
          console.error('   - GitHub credentials configured');
          console.error('   - Permission to push to the repository');
          process.exit(1);
        }
        
        rl.close();
        return;
      }
    }
  } catch (e) {
    // No remote configured, continue
  }
  
  // Get repository URL from argument or prompt
  let repoUrl = repoUrlArg;
  
  if (!repoUrl) {
    // Prompt for repository URL
    console.log('Enter your GitHub repository URL:');
    console.log('Examples:');
    console.log('  - https://github.com/username/repo-name');
    console.log('  - https://github.com/username/repo-name.git');
    console.log('  - git@github.com:username/repo-name.git');
    console.log('');
    console.log('(Or run: npm run push:github -- <your-repo-url>)');
    console.log('');
    
    repoUrl = await question('Repository URL: ');
  }
  
  if (!repoUrl.trim()) {
    console.log('❌ No URL provided. Exiting.');
    rl.close();
    process.exit(1);
  }
  
  // Extract repo info
  const repoInfo = extractRepoInfo(repoUrl.trim());
  
  if (!repoInfo) {
    console.log('❌ Could not parse repository URL. Please check the format.');
    rl.close();
    process.exit(1);
  }
  
  console.log(`\n✅ Detected repository: ${repoInfo.fullName}`);
  
  // Update vite config
  const basePath = updateViteConfig(repoInfo.repoName, repoInfo.username);
  
  // Commit vite config change if needed
  try {
    execSync('git add vite.config.ts', { cwd: projectRoot, stdio: 'ignore' });
    const status = execSync('git status --porcelain vite.config.ts', { 
      cwd: projectRoot, 
      encoding: 'utf8' 
    });
    if (status.trim()) {
      execSync('git commit -m "Update base path for GitHub Pages"', { 
        cwd: projectRoot, 
        stdio: 'ignore' 
      });
      console.log('✅ Committed base path update');
    }
  } catch (e) {
    // No changes or already committed
  }
  
  // Add remote
  console.log('\n📦 Adding remote...');
  try {
    execSync(`git remote add origin "${repoUrl.trim()}"`, { 
      cwd: projectRoot, 
      stdio: 'ignore' 
    });
    console.log('✅ Remote added');
  } catch (e) {
    // Remote might already exist, try to set URL
    try {
      execSync(`git remote set-url origin "${repoUrl.trim()}"`, { 
        cwd: projectRoot, 
        stdio: 'ignore' 
      });
      console.log('✅ Remote updated');
    } catch (e2) {
      console.log('⚠️  Could not add/update remote. You may need to do this manually.');
    }
  }
  
  // Push
  console.log('\n📤 Pushing to GitHub...');
  try {
    execSync('git push -u origin main', { cwd: projectRoot, stdio: 'inherit' });
    console.log('\n✅ Successfully pushed to GitHub!');
    console.log(`\n🌐 Your app will be available at:`);
    console.log(`   https://${repoInfo.username}.github.io${basePath}`);
    console.log(`\n📋 Next step: Enable GitHub Pages`);
    console.log(`   1. Go to: https://github.com/${repoInfo.fullName}/settings/pages`);
    console.log(`   2. Under "Source", select "GitHub Actions"`);
    console.log(`   3. Save`);
    console.log(`\n🎉 That's it! Your app will deploy automatically.`);
  } catch (e) {
    console.error('\n❌ Error pushing to GitHub.');
    console.error('\nPossible issues:');
    console.error('  1. Repository doesn\'t exist - create it on GitHub first');
    console.error('  2. No internet connection');
    console.error('  3. GitHub credentials not configured');
    console.error('  4. No permission to push to repository');
    console.error('\nYou can try manually:');
    console.error(`  git remote add origin "${repoUrl.trim()}"`);
    console.error('  git push -u origin main');
    process.exit(1);
  }
  
  rl.close();
}

main().catch((error) => {
  console.error('Error:', error);
  rl.close();
  process.exit(1);
});

