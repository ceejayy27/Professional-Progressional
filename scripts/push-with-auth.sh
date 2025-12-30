#!/bin/bash

# Script to help push with authentication
# This will guide you through the authentication process

echo "🚀 Pushing to GitHub..."
echo ""
echo "You'll need to authenticate. Choose your method:"
echo ""
echo "Option 1: Personal Access Token (Recommended)"
echo "  1. Go to: https://github.com/settings/tokens"
echo "  2. Generate new token (classic) with 'repo' scope"
echo "  3. Copy the token"
echo "  4. When prompted for password, paste the token"
echo ""
echo "Option 2: GitHub CLI"
echo "  Run: gh auth login"
echo "  Then: git push -u origin main"
echo ""
echo "Attempting push now..."
echo ""

# Try to push
git push -u origin main

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Successfully pushed!"
    echo ""
    echo "📋 Next steps:"
    echo "  1. Check Actions: https://github.com/ceejayy27/Professional-Progressional/actions"
    echo "  2. Wait for deployment to complete"
    echo "  3. Your app will be live at: https://ceejayy27.github.io/Professional-Progressional/"
else
    echo ""
    echo "❌ Push failed. You need to authenticate."
    echo ""
    echo "Quick fix - Run these commands:"
    echo "  git push -u origin main"
    echo "  (Then enter your GitHub username and Personal Access Token when prompted)"
fi

