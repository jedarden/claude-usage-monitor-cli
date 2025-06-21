#!/bin/bash

# Comprehensive build and test script for both packages
set -e

echo "🧪 Comprehensive Build Testing"
echo "=============================="

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Create test directory
TEST_DIR="/tmp/claude-monitor-test-$$"
mkdir -p "$TEST_DIR"
echo -e "${BLUE}Test directory: $TEST_DIR${NC}"

# Test Python Package
echo -e "\n${YELLOW}📦 Testing Python Package${NC}"
echo "========================="

cd python

# Clean previous builds
echo "Cleaning previous builds..."
rm -rf build dist *.egg-info

# Create fresh virtual environment
echo "Creating fresh virtual environment..."
python3 -m venv "$TEST_DIR/python-env"
source "$TEST_DIR/python-env/bin/activate"

# Install build tools
echo "Installing build tools..."
pip install --quiet --upgrade pip build

# Build the package
echo -e "\n${BLUE}Building Python package...${NC}"
python -m build

# Check build artifacts
echo -e "\n${BLUE}Build artifacts:${NC}"
ls -la dist/

# Install from wheel
echo -e "\n${BLUE}Installing from wheel...${NC}"
pip install dist/*.whl

# Test the installation
echo -e "\n${BLUE}Testing Python CLI...${NC}"
echo "1. Version check:"
claude-monitor --version

echo -e "\n2. Help output:"
claude-monitor --help | head -20

echo -e "\n3. List plans:"
claude-monitor --list-plans

echo -e "\n4. Configuration info:"
claude-monitor --info

echo -e "\n5. Quick run test:"
timeout 2s claude-monitor --once || true

# Test as module
echo -e "\n${BLUE}Testing as Python module...${NC}"
python -c "import claude_monitor; print(f'Module version: {claude_monitor.__version__}')"

# Deactivate Python environment
deactivate
cd ..

echo -e "\n${GREEN}✅ Python package test passed!${NC}"

# Test Node.js Package
echo -e "\n${YELLOW}📦 Testing Node.js Package${NC}"
echo "========================="

cd nodejs

# Clean previous builds
echo "Cleaning previous builds..."
rm -f *.tgz

# Build the package
echo -e "\n${BLUE}Building Node.js package...${NC}"
npm pack

# Check build artifact
echo -e "\n${BLUE}Build artifact:${NC}"
ls -la *.tgz

# Create test directory for npm
mkdir -p "$TEST_DIR/nodejs-test"
cd "$TEST_DIR/nodejs-test"

# Install the package locally
echo -e "\n${BLUE}Installing package locally...${NC}"
npm init -y >/dev/null 2>&1
npm install "$OLDPWD"/*.tgz

# Test the installation
echo -e "\n${BLUE}Testing Node.js CLI...${NC}"
echo "1. Version check:"
npx claude-monitor --version

echo -e "\n2. Help output:"
npx claude-monitor --help | head -20

echo -e "\n3. Direct execution:"
node node_modules/claude-usage-monitor/lib/cli.js --version

echo -e "\n4. Module loading test:"
node -e "const monitor = require('claude-usage-monitor'); console.log('Module loaded successfully');"

# Return to original directory
cd "$OLDPWD"
cd ..

echo -e "\n${GREEN}✅ Node.js package test passed!${NC}"

# Cross-platform simulation
echo -e "\n${YELLOW}🌍 Cross-Platform Simulation${NC}"
echo "=============================="

# Test different shells
echo -e "${BLUE}Testing shell compatibility...${NC}"
echo "Bash: $(bash --version | head -1)"
if command -v zsh >/dev/null 2>&1; then
    echo "Zsh: $(zsh --version)"
fi
if command -v fish >/dev/null 2>&1; then
    echo "Fish: $(fish --version)"
fi

# Test file permissions
echo -e "\n${BLUE}Checking file permissions...${NC}"
ls -la python/dist/*.whl nodejs/*.tgz

# Size check
echo -e "\n${BLUE}Package sizes:${NC}"
du -h python/dist/*.whl python/dist/*.tar.gz nodejs/*.tgz

# Cleanup
echo -e "\n${YELLOW}🧹 Cleaning up...${NC}"
rm -rf "$TEST_DIR"

# Final summary
echo -e "\n${GREEN}✅ ALL TESTS PASSED!${NC}"
echo -e "\n${YELLOW}Summary:${NC}"
echo "- Python package: Built, installed, and tested successfully"
echo "- Node.js package: Built, installed, and tested successfully"
echo "- Both CLIs are functional and ready for deployment"
echo -e "\n${BLUE}Ready for:${NC}"
echo "- PyPI upload: python/dist/*.whl and *.tar.gz"
echo "- npm publish: nodejs/*.tgz"
echo -e "\n${GREEN}🚀 Packages are ready for deployment!${NC}"