#!/bin/bash

# Deploy script for Claude Usage Monitor CLI packages

set -e

echo "🚀 Claude Usage Monitor CLI Deployment Script"
echo "============================================"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [ ! -f "README.md" ] || [ ! -d "python" ] || [ ! -d "nodejs" ]; then
    echo -e "${RED}Error: Please run this script from the claude-usage-monitor-cli root directory${NC}"
    exit 1
fi

# Function to deploy Python package
deploy_python() {
    echo -e "\n${YELLOW}📦 Deploying Python Package${NC}"
    cd python
    
    # Check if virtual env exists
    if [ ! -d "build_env" ]; then
        echo "Creating Python build environment..."
        python3 -m venv build_env
        source build_env/bin/activate
        pip install --upgrade pip build twine
    else
        source build_env/bin/activate
    fi
    
    # Check if dist files exist
    if [ ! -f "dist/claude_usage_monitor-1.0.0.tar.gz" ]; then
        echo "Building Python package..."
        python -m build
    fi
    
    echo -e "\n${GREEN}Ready to upload to PyPI!${NC}"
    echo "Files to upload:"
    ls -la dist/
    
    echo -e "\n${YELLOW}Choose deployment target:${NC}"
    echo "1) Test PyPI (recommended for first time)"
    echo "2) Production PyPI"
    echo "3) Skip Python deployment"
    read -p "Enter choice (1-3): " choice
    
    case $choice in
        1)
            echo -e "\n${YELLOW}Uploading to Test PyPI...${NC}"
            echo "You'll need a Test PyPI account: https://test.pypi.org/account/register/"
            twine upload --repository testpypi dist/*
            echo -e "\n${GREEN}Test deployment complete!${NC}"
            echo "Install with: pip install -i https://test.pypi.org/simple/ claude-usage-monitor"
            ;;
        2)
            echo -e "\n${YELLOW}Uploading to Production PyPI...${NC}"
            twine upload dist/*
            echo -e "\n${GREEN}Production deployment complete!${NC}"
            echo "Install with: pip install claude-usage-monitor"
            ;;
        3)
            echo "Skipping Python deployment"
            ;;
    esac
    
    deactivate
    cd ..
}

# Function to deploy Node.js package
deploy_nodejs() {
    echo -e "\n${YELLOW}📦 Deploying Node.js Package${NC}"
    cd nodejs
    
    # Check if package is built
    if [ ! -f "claude-usage-monitor-1.0.0.tgz" ]; then
        echo "Building Node.js package..."
        npm pack
    fi
    
    echo -e "\n${GREEN}Ready to upload to npm!${NC}"
    echo "Package file: claude-usage-monitor-1.0.0.tgz"
    
    echo -e "\n${YELLOW}Choose deployment target:${NC}"
    echo "1) Dry run (recommended for first time)"
    echo "2) Production npm"
    echo "3) Skip Node.js deployment"
    read -p "Enter choice (1-3): " choice
    
    case $choice in
        1)
            echo -e "\n${YELLOW}Running npm publish dry run...${NC}"
            npm publish --dry-run
            echo -e "\n${GREEN}Dry run complete!${NC}"
            ;;
        2)
            echo -e "\n${YELLOW}Publishing to npm...${NC}"
            echo "Make sure you're logged in: npm login"
            npm publish
            echo -e "\n${GREEN}npm deployment complete!${NC}"
            echo "Install with: npm install -g claude-usage-monitor"
            ;;
        3)
            echo "Skipping Node.js deployment"
            ;;
    esac
    
    cd ..
}

# Main menu
echo -e "\n${YELLOW}What would you like to deploy?${NC}"
echo "1) Python package only"
echo "2) Node.js package only"
echo "3) Both packages"
echo "4) Exit"
read -p "Enter choice (1-4): " main_choice

case $main_choice in
    1)
        deploy_python
        ;;
    2)
        deploy_nodejs
        ;;
    3)
        deploy_python
        deploy_nodejs
        ;;
    4)
        echo "Exiting..."
        exit 0
        ;;
    *)
        echo -e "${RED}Invalid choice${NC}"
        exit 1
        ;;
esac

echo -e "\n${GREEN}✅ Deployment script complete!${NC}"
echo -e "\n${YELLOW}Next steps:${NC}"
echo "1. Add secrets to GitHub: https://github.com/jedarden/claude-usage-monitor-cli/settings/secrets/actions"
echo "   - PYPI_API_TOKEN"
echo "   - NPM_TOKEN"
echo "2. Create a release tag: git tag v1.0.0 && git push origin v1.0.0"
echo "3. Future deployments will be automatic via GitHub Actions!"