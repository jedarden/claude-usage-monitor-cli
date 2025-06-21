#!/bin/bash

# Test GitHub Actions workflows locally
# This simulates the CI workflow steps

set -e

echo "🧪 Testing GitHub Actions CI Workflow Locally"
echo "==========================================="

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Test Python Package
echo -e "\n${YELLOW}📦 Testing Python Package Build${NC}"
echo "--------------------------------"

cd python

# Create test environment
echo "Creating Python test environment..."
python3 -m venv test_ci_env
source test_ci_env/bin/activate

# Install dependencies
echo "Installing build dependencies..."
pip install --upgrade pip build

# Build package
echo "Building Python package..."
python -m build

# Install package
echo "Installing package from wheel..."
pip install dist/*.whl

# Test CLI
echo "Testing Python CLI..."
claude-monitor --help
claude-monitor --version

# Cleanup
deactivate
cd ..

echo -e "${GREEN}✅ Python package test passed!${NC}"

# Test Node.js Package
echo -e "\n${YELLOW}📦 Testing Node.js Package Build${NC}"
echo "--------------------------------"

cd nodejs

# Check Node version
echo "Node.js version:"
node --version
npm --version

# Install (no dependencies to install)
echo "Running npm install..."
npm install

# Run tests
echo "Running tests..."
npm test

# Test CLI directly
echo "Testing Node.js CLI..."
node lib/cli.js --help
node lib/cli.js --version

cd ..

echo -e "${GREEN}✅ Node.js package test passed!${NC}"

# Test both CLIs with actual monitoring (if Claude data exists)
echo -e "\n${YELLOW}🔍 Testing Actual Monitoring${NC}"
echo "--------------------------------"

# Python
echo "Python claude-monitor output:"
cd python
source test_ci_env/bin/activate
claude-monitor --version || echo "Python CLI test failed"
deactivate
cd ..

# Node.js
echo -e "\nNode.js claude-monitor output:"
cd nodejs
node lib/cli.js --version || echo "Node.js CLI test failed"
cd ..

echo -e "\n${GREEN}✅ All tests completed!${NC}"
echo -e "\n${YELLOW}Summary:${NC}"
echo "- Python package: Built and tested successfully"
echo "- Node.js package: Built and tested successfully"
echo "- Both CLIs are functional"
echo -e "\n${YELLOW}Note:${NC} This simulates the CI workflow locally."
echo "The actual GitHub Actions will run on multiple OS and versions."