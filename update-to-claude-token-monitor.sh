#!/bin/bash

# Update all references from claude-token-monitor to claude-token-monitor
echo "Updating package name to claude-token-monitor..."

# Find and replace in all files
find . -type f \( -name "*.md" -o -name "*.json" -o -name "*.toml" -o -name "*.yml" -o -name "*.yaml" -o -name "*.sh" \) \
    -not -path "./.git/*" \
    -not -path "./*/node_modules/*" \
    -not -path "./*/*/dist/*" \
    -not -path "./*/*/build/*" \
    -not -path "./*/*/.tox/*" \
    -not -path "./*/*/venv/*" \
    -not -path "./*/*/env/*" \
    -exec sed -i 's/claude-token-monitor/claude-token-monitor/g' {} +

echo "Package name updated to claude-token-monitor"