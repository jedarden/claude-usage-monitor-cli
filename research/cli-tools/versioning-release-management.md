# CLI Tools Versioning and Release Management Guide

## Table of Contents
1. [Semantic Versioning Strategies](#semantic-versioning-strategies)
2. [Changelog Generation and Maintenance](#changelog-generation-and-maintenance)
3. [Release Automation Workflows](#release-automation-workflows)
4. [Beta/RC Release Strategies](#betarc-release-strategies)
5. [Deprecation and Breaking Change Management](#deprecation-and-breaking-change-management)
6. [Multi-Version Support Strategies](#multi-version-support-strategies)
7. [Case Studies](#case-studies)
8. [CI/CD Templates](#cicd-templates)
9. [Tools and Resources](#tools-and-resources)

## Semantic Versioning Strategies

### Core Principles (SemVer 2.0.0)
```
MAJOR.MINOR.PATCH
```

- **MAJOR**: Breaking API changes
- **MINOR**: New features (backwards compatible)
- **PATCH**: Bug fixes (backwards compatible)

### Automated Version Bumping Tools

#### 1. **semantic-release** (Node.js ecosystem)
```json
{
  "release": {
    "branches": ["main", "next"],
    "plugins": [
      "@semantic-release/commit-analyzer",
      "@semantic-release/release-notes-generator",
      "@semantic-release/changelog",
      "@semantic-release/npm",
      "@semantic-release/github"
    ]
  }
}
```

#### 2. **bump2version** (Python)
```ini
[bumpversion]
current_version = 1.2.3
commit = True
tag = True

[bumpversion:file:setup.py]
search = version='{current_version}'
replace = version='{new_version}'

[bumpversion:file:pyproject.toml]
search = version = "{current_version}"
replace = version = "{new_version}"
```

#### 3. **standard-version** (Language agnostic)
```json
{
  "scripts": {
    "release": "standard-version",
    "release:minor": "standard-version --release-as minor",
    "release:patch": "standard-version --release-as patch",
    "release:major": "standard-version --release-as major"
  }
}
```

### Commit Message Conventions

#### Conventional Commits
```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

Types:
- `feat:` New feature (triggers MINOR)
- `fix:` Bug fix (triggers PATCH)
- `BREAKING CHANGE:` Breaking change (triggers MAJOR)
- `docs:` Documentation only
- `style:` Code style changes
- `refactor:` Code refactoring
- `perf:` Performance improvements
- `test:` Test additions/changes
- `chore:` Maintenance tasks

## Changelog Generation and Maintenance

### Automated Changelog Generation

#### 1. **conventional-changelog**
```bash
# Generate changelog from commits
conventional-changelog -p angular -i CHANGELOG.md -s

# With custom configuration
conventional-changelog -p conventionalcommits -i CHANGELOG.md -s -r 0
```

#### 2. **auto-changelog**
```json
{
  "auto-changelog": {
    "output": "CHANGELOG.md",
    "template": "keepachangelog",
    "unreleased": true,
    "commitLimit": false,
    "backfillLimit": false
  }
}
```

### Changelog Format (Keep a Changelog)
```markdown
# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.0.0] - 2025-01-21
### Added
- New features

### Changed
- Changes in existing functionality

### Deprecated
- Soon-to-be removed features

### Removed
- Removed features

### Fixed
- Bug fixes

### Security
- Vulnerability fixes
```

### Automated Changelog Update Script
```python
#!/usr/bin/env python3
import re
import subprocess
from datetime import datetime

def update_changelog(version, changes):
    with open('CHANGELOG.md', 'r') as f:
        content = f.read()
    
    # Insert new version after Unreleased
    date = datetime.now().strftime('%Y-%m-%d')
    new_section = f"\n## [{version}] - {date}\n{changes}\n"
    
    content = re.sub(
        r'(## \[Unreleased\])',
        f'\\1\n{new_section}',
        content
    )
    
    with open('CHANGELOG.md', 'w') as f:
        f.write(content)
```

## Release Automation Workflows

### GitHub Actions Release Workflow
```yaml
name: Release

on:
  push:
    branches:
      - main

jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
        with:
          fetch-depth: 0
          persist-credentials: false

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm test

      - name: Release
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          NPM_TOKEN: ${{ secrets.NPM_TOKEN }}
        run: npx semantic-release
```

### GitLab CI/CD Release Pipeline
```yaml
stages:
  - test
  - build
  - release

variables:
  DOCKER_DRIVER: overlay2

test:
  stage: test
  script:
    - npm ci
    - npm test
  coverage: '/Lines\s*:\s*(\d+\.\d+)%/'

build:
  stage: build
  script:
    - npm run build
  artifacts:
    paths:
      - dist/
    expire_in: 1 week

release:
  stage: release
  only:
    - main
  script:
    - npm ci
    - npx semantic-release
  environment:
    name: production
```

### Multi-Platform Release Script
```bash
#!/bin/bash
set -e

VERSION=$1
PLATFORMS=("linux/amd64" "linux/arm64" "darwin/amd64" "darwin/arm64" "windows/amd64")

echo "Building version $VERSION for multiple platforms..."

for PLATFORM in "${PLATFORMS[@]}"; do
    OS=$(echo $PLATFORM | cut -d'/' -f1)
    ARCH=$(echo $PLATFORM | cut -d'/' -f2)
    
    echo "Building for $OS/$ARCH..."
    GOOS=$OS GOARCH=$ARCH go build -o "dist/mycli-$VERSION-$OS-$ARCH" ./cmd/mycli
done

echo "Creating checksums..."
cd dist && sha256sum * > checksums.txt
```

## Beta/RC Release Strategies

### Pre-release Versioning
```
1.0.0-alpha < 1.0.0-alpha.1 < 1.0.0-alpha.beta < 1.0.0-beta < 1.0.0-beta.2 < 1.0.0-beta.11 < 1.0.0-rc.1 < 1.0.0
```

### Beta Release Workflow
```yaml
name: Beta Release

on:
  push:
    branches:
      - beta
      - 'release/*'

jobs:
  beta-release:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Determine version
        id: version
        run: |
          # Get latest tag
          LATEST_TAG=$(git describe --tags --abbrev=0 2>/dev/null || echo "0.0.0")
          # Generate beta version
          BETA_VERSION="${LATEST_TAG}-beta.$(date +%s)"
          echo "version=$BETA_VERSION" >> $GITHUB_OUTPUT
      
      - name: Create beta release
        run: |
          npm version ${{ steps.version.outputs.version }} --no-git-tag-version
          npm publish --tag beta
```

### Release Candidate Testing Framework
```python
# rc_testing.py
import subprocess
import json
from typing import List, Dict

class RCTester:
    def __init__(self, rc_version: str):
        self.rc_version = rc_version
        self.test_results = []
    
    def run_integration_tests(self) -> bool:
        """Run comprehensive integration tests for RC"""
        tests = [
            self.test_backwards_compatibility,
            self.test_performance_regression,
            self.test_security_vulnerabilities,
            self.test_platform_compatibility
        ]
        
        for test in tests:
            result = test()
            self.test_results.append(result)
        
        return all(r['passed'] for r in self.test_results)
    
    def generate_rc_report(self) -> Dict:
        return {
            'version': self.rc_version,
            'test_results': self.test_results,
            'ready_for_release': all(r['passed'] for r in self.test_results)
        }
```

## Deprecation and Breaking Change Management

### Deprecation Policy Template
```markdown
# Deprecation Policy

## Timeline
1. **Deprecation Announcement**: Feature marked as deprecated in version X.Y.0
2. **Warning Period**: Deprecation warnings shown for 2 minor releases
3. **Removal**: Feature removed in next major version (X+1.0.0)

## Communication Channels
- Release notes
- CLI warnings
- Documentation updates
- Blog posts for major deprecations
```

### Deprecation Warning Implementation
```python
import warnings
from functools import wraps

def deprecated(since_version, remove_version, alternative=None):
    """Decorator to mark functions as deprecated"""
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            message = (
                f"{func.__name__} is deprecated since version {since_version} "
                f"and will be removed in version {remove_version}."
            )
            if alternative:
                message += f" Use {alternative} instead."
            warnings.warn(message, DeprecationWarning, stacklevel=2)
            return func(*args, **kwargs)
        return wrapper
    return decorator

# Usage
@deprecated(since_version="2.0.0", remove_version="3.0.0", alternative="new_function")
def old_function():
    pass
```

### Breaking Change Communication
```javascript
// cli.js - Breaking change detection
const chalk = require('chalk');

class BreakingChangeDetector {
  constructor(currentVersion, configPath) {
    this.currentVersion = currentVersion;
    this.config = this.loadConfig(configPath);
  }

  checkForBreakingChanges() {
    const breakingChanges = this.config.breakingChanges || [];
    const relevantChanges = breakingChanges.filter(change => 
      this.isVersionAffected(change.affectsVersions)
    );

    if (relevantChanges.length > 0) {
      this.displayBreakingChangeWarning(relevantChanges);
    }
  }

  displayBreakingChangeWarning(changes) {
    console.log(chalk.yellow('\n⚠️  Breaking Changes Detected:\n'));
    changes.forEach(change => {
      console.log(chalk.red(`• ${change.description}`));
      if (change.migration) {
        console.log(chalk.blue(`  Migration: ${change.migration}`));
      }
    });
    console.log('\n');
  }
}
```

## Multi-Version Support Strategies

### Version Manager Implementation
```bash
#!/bin/bash
# mycli-version-manager.sh

MYCLI_ROOT="${HOME}/.mycli"
VERSIONS_DIR="${MYCLI_ROOT}/versions"
CURRENT_LINK="${MYCLI_ROOT}/current"

install_version() {
    local version=$1
    local install_dir="${VERSIONS_DIR}/${version}"
    
    if [ -d "$install_dir" ]; then
        echo "Version $version already installed"
        return 0
    fi
    
    echo "Installing mycli version $version..."
    mkdir -p "$install_dir"
    
    # Download and install specific version
    curl -L "https://github.com/org/mycli/releases/download/v${version}/mycli-${version}.tar.gz" | \
        tar -xz -C "$install_dir"
    
    echo "Version $version installed successfully"
}

use_version() {
    local version=$1
    local version_dir="${VERSIONS_DIR}/${version}"
    
    if [ ! -d "$version_dir" ]; then
        echo "Version $version not installed. Installing..."
        install_version "$version"
    fi
    
    ln -sfn "$version_dir" "$CURRENT_LINK"
    echo "Now using mycli version $version"
}

list_versions() {
    echo "Installed versions:"
    ls -1 "$VERSIONS_DIR" 2>/dev/null || echo "No versions installed"
    
    if [ -L "$CURRENT_LINK" ]; then
        current=$(readlink "$CURRENT_LINK" | xargs basename)
        echo -e "\nCurrent version: $current"
    fi
}
```

### Version Compatibility Matrix
```yaml
# version-compatibility.yaml
compatibility:
  cli_versions:
    "1.0.0":
      api_versions: ["v1"]
      deprecated_features: []
      minimum_runtime: "node:14"
    
    "2.0.0":
      api_versions: ["v1", "v2"]
      deprecated_features: ["legacy-auth"]
      minimum_runtime: "node:16"
      breaking_changes:
        - description: "Removed support for legacy authentication"
          migration: "Use token-based authentication"
    
    "3.0.0":
      api_versions: ["v2", "v3"]
      deprecated_features: ["xml-output"]
      minimum_runtime: "node:18"
      breaking_changes:
        - description: "Removed API v1 support"
          migration: "Update to API v2 or v3"
```

## Case Studies

### Node.js LTS Strategy
```
Current  -> Maintenance -> End of Life
(6 months)  (18 months)    (EOL)

Example:
- v18.0.0 (Apr 2022) - Current
- v18.12.0 (Oct 2022) - LTS Begins
- v19.0.0 (Oct 2022) - v18 enters Maintenance
- v20.0.0 (Apr 2023) - v18 continues Maintenance
- Apr 2025 - v18 End of Life
```

### Python Deprecation Policy
```python
# PEP 387 - Backwards Compatibility Policy
"""
1. Deprecation warning for at least 2 releases
2. DeprecationWarning by default
3. Clear migration path documented
4. Removal only in major version changes
"""

# Example implementation
import sys
import warnings

if sys.version_info[:2] == (3, 11):
    warnings.warn(
        "Function X is deprecated and will be removed in Python 3.13",
        DeprecationWarning,
        stacklevel=2
    )
```

### Kubernetes Release Cycle
```
- 3 releases per year
- 4 month release cycle
- 12 month support window
- Clear upgrade path between versions

Version Skew Policy:
- kubectl: +/- 1 minor version
- kube-apiserver: n-1 minor versions
- kubelet: n-2 minor versions
```

## CI/CD Templates

### Complete Release Pipeline (GitHub Actions)
```yaml
name: Complete Release Pipeline

on:
  workflow_dispatch:
    inputs:
      release_type:
        description: 'Release type'
        required: true
        default: 'patch'
        type: choice
        options:
          - patch
          - minor
          - major
          - prerelease

env:
  NODE_VERSION: '18'
  PYTHON_VERSION: '3.11'

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
        with:
          fetch-depth: 0
      
      - name: Validate commit messages
        run: |
          npx commitlint --from=HEAD~10 --to=HEAD
      
      - name: Check for breaking changes
        run: |
          ./scripts/check-breaking-changes.sh

  test:
    needs: validate
    strategy:
      matrix:
        os: [ubuntu-latest, macos-latest, windows-latest]
        node: [16, 18, 20]
    runs-on: ${{ matrix.os }}
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: ${{ matrix.node }}
      
      - name: Run tests
        run: |
          npm ci
          npm test
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3

  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup build environment
        run: |
          npm ci
          pip install build twine
      
      - name: Build distributions
        run: |
          npm run build
          python -m build
      
      - name: Upload artifacts
        uses: actions/upload-artifact@v3
        with:
          name: dist
          path: |
            dist/
            *.whl
            *.tar.gz

  release:
    needs: build
    runs-on: ubuntu-latest
    permissions:
      contents: write
      packages: write
    steps:
      - uses: actions/checkout@v3
        with:
          fetch-depth: 0
          token: ${{ secrets.GITHUB_TOKEN }}
      
      - name: Setup Git
        run: |
          git config user.name "github-actions[bot]"
          git config user.email "github-actions[bot]@users.noreply.github.com"
      
      - name: Determine version
        id: version
        run: |
          # Bump version based on input
          npm version ${{ github.event.inputs.release_type }} --no-git-tag-version
          VERSION=$(node -p "require('./package.json').version")
          echo "version=$VERSION" >> $GITHUB_OUTPUT
      
      - name: Update changelog
        run: |
          npx conventional-changelog -p angular -i CHANGELOG.md -s
          git add CHANGELOG.md
      
      - name: Commit version bump
        run: |
          git add package.json package-lock.json
          git commit -m "chore(release): ${{ steps.version.outputs.version }}"
          git tag v${{ steps.version.outputs.version }}
      
      - name: Push changes
        run: |
          git push origin main
          git push origin v${{ steps.version.outputs.version }}
      
      - name: Create GitHub Release
        uses: softprops/action-gh-release@v1
        with:
          tag_name: v${{ steps.version.outputs.version }}
          generate_release_notes: true
          files: |
            dist/*
            checksums.txt
      
      - name: Publish to npm
        run: |
          npm publish
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
      
      - name: Publish to PyPI
        run: |
          twine upload dist/*
        env:
          TWINE_USERNAME: __token__
          TWINE_PASSWORD: ${{ secrets.PYPI_TOKEN }}

  post-release:
    needs: release
    runs-on: ubuntu-latest
    steps:
      - name: Update documentation
        run: |
          # Update version in docs
          ./scripts/update-docs-version.sh
      
      - name: Notify channels
        run: |
          # Send notifications to Slack, Discord, etc.
          ./scripts/notify-release.sh
```

### Rollback Procedure
```bash
#!/bin/bash
# rollback.sh - Emergency rollback script

set -e

ROLLBACK_VERSION=$1
CURRENT_VERSION=$(npm version --json | jq -r '.mycli')

echo "Rolling back from $CURRENT_VERSION to $ROLLBACK_VERSION"

# Revert npm publication
npm unpublish mycli@$CURRENT_VERSION

# Revert PyPI publication (if within 24 hours)
# Note: PyPI doesn't allow deletion after 24 hours

# Tag rollback in git
git tag -a "rollback-$CURRENT_VERSION-to-$ROLLBACK_VERSION" -m "Emergency rollback"
git push origin --tags

# Update latest tag to point to rollback version
git tag -f latest v$ROLLBACK_VERSION
git push origin latest --force

# Notify users
./scripts/send-rollback-notification.sh "$CURRENT_VERSION" "$ROLLBACK_VERSION"
```

## Tools and Resources

### Version Management Tools
1. **semantic-release** - Fully automated version management
2. **standard-version** - Conventional commits based versioning
3. **release-it** - Generic release automation tool
4. **goreleaser** - Go binary release automation
5. **cargo-release** - Rust release automation

### Changelog Tools
1. **conventional-changelog** - Generate changelogs from commits
2. **auto-changelog** - Automatic changelog generation
3. **github-changelog-generator** - Ruby-based changelog generator
4. **git-cliff** - Customizable changelog generator

### Testing Tools
1. **npm-check-updates** - Check for dependency updates
2. **dependency-check** - Security vulnerability scanning
3. **license-checker** - License compatibility verification
4. **bundlephobia** - Package size analysis

### Best Practices Resources
1. [Semantic Versioning Specification](https://semver.org/)
2. [Keep a Changelog](https://keepachangelog.com/)
3. [Conventional Commits](https://www.conventionalcommits.org/)
4. [The Twelve-Factor App](https://12factor.net/)

### Example Configuration Files

#### .versionrc.json (standard-version)
```json
{
  "types": [
    {"type": "feat", "section": "Features"},
    {"type": "fix", "section": "Bug Fixes"},
    {"type": "chore", "hidden": true},
    {"type": "docs", "hidden": true},
    {"type": "style", "hidden": true},
    {"type": "refactor", "hidden": true},
    {"type": "perf", "section": "Performance"},
    {"type": "test", "hidden": true}
  ],
  "commitUrlFormat": "https://github.com/org/repo/commit/{{hash}}",
  "compareUrlFormat": "https://github.com/org/repo/compare/{{previousTag}}...{{currentTag}}"
}
```

#### .release-it.json
```json
{
  "git": {
    "commitMessage": "chore: release v${version}",
    "tagName": "v${version}",
    "requireCleanWorkingDir": true
  },
  "github": {
    "release": true,
    "releaseName": "Release v${version}",
    "draft": false,
    "preRelease": false
  },
  "npm": {
    "publish": true,
    "publishPath": "."
  },
  "hooks": {
    "before:init": ["npm test", "npm run lint"],
    "after:bump": "npm run build",
    "after:git:release": "echo Successfully released ${name} v${version} to ${repo.repository}."
  }
}
```

This comprehensive guide provides a complete framework for versioning and release management of CLI tools, incorporating industry best practices and real-world examples from major projects.