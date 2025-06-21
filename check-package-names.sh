#!/bin/bash

# Script to check package name availability on PyPI and npm

echo "🔍 Checking Package Name Availability"
echo "===================================="

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Function to check PyPI
check_pypi() {
    local name=$1
    # Check if package exists on PyPI
    if curl -s "https://pypi.org/pypi/$name/json" | grep -q "Not Found"; then
        echo -e "  PyPI: ${GREEN}✓ Available${NC}"
        return 0
    else
        echo -e "  PyPI: ${RED}✗ Taken${NC}"
        return 1
    fi
}

# Function to check npm
check_npm() {
    local name=$1
    # Check if package exists on npm
    if npm view "$name" 2>&1 | grep -q "404"; then
        echo -e "  npm:  ${GREEN}✓ Available${NC}"
        return 0
    else
        echo -e "  npm:  ${RED}✗ Taken${NC}"
        return 1
    fi
}

# Check a name on both platforms
check_name() {
    local name=$1
    echo -e "\n${YELLOW}Checking: $name${NC}"
    
    pypi_available=false
    npm_available=false
    
    if check_pypi "$name"; then
        pypi_available=true
    fi
    
    if check_npm "$name"; then
        npm_available=true
    fi
    
    if [ "$pypi_available" = true ] && [ "$npm_available" = true ]; then
        echo -e "  ${GREEN}✅ AVAILABLE ON BOTH!${NC}"
        return 0
    fi
    
    return 1
}

# List of potential names to check
names=(
    "claude-usage-monitor"
    "claude-monitor"
    "claude-usage-tracker"
    "claude-token-monitor"
    "claude-api-monitor"
    "claude-token-monitor"
    "claude-usage"
    "claudetrack"
    "claude-tracker"
    "claudemon"
    "claude-meter"
    "claude-usage-meter"
    "claude-ai-monitor"
    "claude-consumption"
    "claude-stats"
    "claude-usage-stats"
    "claude-dashboard"
    "claude-metrics"
    "claude-watch"
    "claude-watcher"
    "ai-usage-monitor"
    "anthropic-monitor"
    "anthropic-usage"
    "anthropic-tracker"
)

# Check each name
available_names=()
for name in "${names[@]}"; do
    if check_name "$name"; then
        available_names+=("$name")
    fi
    sleep 0.5  # Be nice to the APIs
done

# Summary
echo -e "\n${YELLOW}📋 Summary${NC}"
echo "=========="
if [ ${#available_names[@]} -eq 0 ]; then
    echo -e "${RED}No names available on both platforms${NC}"
else
    echo -e "${GREEN}Available on both PyPI and npm:${NC}"
    for name in "${available_names[@]}"; do
        echo "  - $name"
    done
fi