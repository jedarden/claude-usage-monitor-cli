#!/bin/bash

# Update all references from claude-usage-cli back to claude-usage-cli
echo "Reverting package name to claude-usage-cli..."

# Find and replace in all files
find . -type f \( -name "*.md" -o -name "*.json" -o -name "*.toml" -o -name "*.yml" -o -name "*.yaml" -o -name "*.sh" \) \
    -not -path "./.git/*" \
    -not -path "./*/node_modules/*" \
    -not -path "./*/*/dist/*" \
    -not -path "./*/*/build/*" \
    -not -path "./*/*/.tox/*" \
    -not -path "./*/*/venv/*" \
    -not -path "./*/*/env/*" \
    -exec sed -i 's/claude-usage-cli/claude-usage-cli/g' {} +

echo "Package name reverted to claude-usage-cli"