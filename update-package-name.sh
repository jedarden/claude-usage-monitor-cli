#!/bin/bash

# Script to update package name throughout the repository
set -e

OLD_NAME="claude-usage-monitor"
NEW_NAME="claude-usage-cli"
OLD_REPO="claude-usage-monitor-cli"
NEW_REPO="claude-usage-cli"

echo "📝 Updating package name from $OLD_NAME to $NEW_NAME"
echo "===================================================="

# Update Python package
echo "🐍 Updating Python package..."
sed -i "s/name = \"$OLD_NAME\"/name = \"$NEW_NAME\"/g" python/pyproject.toml
sed -i "s/$OLD_NAME/$NEW_NAME/g" python/README.md

# Update Node.js package
echo "📦 Updating Node.js package..."
sed -i "s/\"name\": \"$OLD_NAME\"/\"name\": \"$NEW_NAME\"/g" nodejs/package.json
sed -i "s/$OLD_NAME/$NEW_NAME/g" nodejs/README.md
sed -i "s/$OLD_NAME/$NEW_NAME/g" nodejs/INSTALL.md

# Update main README
echo "📄 Updating main documentation..."
sed -i "s/$OLD_NAME/$NEW_NAME/g" README.md
sed -i "s/$OLD_NAME/$NEW_NAME/g" ATTRIBUTION.md
sed -i "s/$OLD_NAME/$NEW_NAME/g" CONTRIBUTING.md
sed -i "s/$OLD_NAME/$NEW_NAME/g" DEPLOYMENT_INSTRUCTIONS.md
sed -i "s/$OLD_NAME/$NEW_NAME/g" GITHUB_SETUP.md
sed -i "s/$OLD_NAME/$NEW_NAME/g" *.md

# Update GitHub repository references
echo "🔗 Updating GitHub repository references..."
find . -type f -name "*.md" -o -name "*.yml" -o -name "*.yaml" -o -name "*.json" | while read file; do
    if [[ -f "$file" && ! "$file" =~ node_modules|test_env|build_env|dist|.git ]]; then
        sed -i "s|github.com/jedarden/$OLD_REPO|github.com/jedarden/$NEW_REPO|g" "$file" 2>/dev/null || true
    fi
done

# Update CLI command references
echo "💻 Updating CLI command references..."
# Keep claude-monitor as the command name for backward compatibility
# But update package installation instructions

# Clean up old build artifacts
echo "🧹 Cleaning old build artifacts..."
rm -rf python/dist/*.whl python/dist/*.tar.gz
rm -rf python/*.egg-info
rm -rf nodejs/*.tgz

echo "✅ Package name update complete!"
echo ""
echo "Summary of changes:"
echo "- Package name: $OLD_NAME → $NEW_NAME"
echo "- Repository: $OLD_REPO → $NEW_REPO"
echo "- Command name: claude-monitor (unchanged)"
echo ""
echo "Next steps:"
echo "1. Review the changes"
echo "2. Rebuild both packages"
echo "3. Update GitHub repository name to: $NEW_REPO"