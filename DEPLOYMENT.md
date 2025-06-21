# GitHub Deployment Guide

This repository is ready for deployment to GitHub. Here's what you need to do:

## 1. Create GitHub Repository
Create a new repository on GitHub named `claude-usage-monitor-cli`

## 2. Push to GitHub
```bash
cd /workspaces/devpod-base-test/claude-usage-monitor-cli
git remote add origin https://github.com/YOUR_USERNAME/claude-usage-monitor-cli.git
git push -u origin main
```

## 3. Configure Secrets (Optional)
If you want to enable automatic publishing to PyPI and npm:

1. Go to Settings → Secrets and variables → Actions
2. Add the following secrets:
   - `PYPI_API_TOKEN` - Your PyPI API token
   - `NPM_TOKEN` - Your npm access token

## 4. Update README
Replace `your-username` in README.md badges with your actual GitHub username

## 5. Create First Release
```bash
git tag v1.0.0
git push origin v1.0.0
```

## Repository Structure
```
claude-usage-monitor-cli/
├── .github/workflows/      # GitHub Actions CI/CD
├── python/                 # Python package source
├── nodejs/                 # Node.js package source  
├── docs/                   # Additional documentation
├── README.md              # Main documentation
├── LICENSE                # MIT License
├── ATTRIBUTION.md         # Credits to original author
├── CONTRIBUTING.md        # Contribution guidelines
└── CHANGELOG.md           # Version history
```

## Features
- ✅ Zero external dependencies
- ✅ Dual distribution (pip + npm)
- ✅ Cross-platform support
- ✅ Automated CI/CD
- ✅ Comprehensive documentation
- ✅ Proper attribution to original author

## Attribution
This project is based on [Claude-Code-Usage-Monitor](https://github.com/Maciek-roboblog/Claude-Code-Usage-Monitor) by Maciej (maciek@roboblog.eu)