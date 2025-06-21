# Installation Guide

## Claude Usage Monitor - Zero Dependencies Node.js Package

### Quick Install

```bash
# Global installation (recommended)
npm install -g claude-usage-cli

# After installation, use anywhere:
claude-monitor --help
```

### Local Development Install

```bash
# Clone or download the package
cd claude-usage-cli

# Install globally from local directory
npm install -g .

# Or link for development
npm link
```

### Manual Installation

```bash
# From packaged tarball
npm install -g claude-usage-cli-1.0.0.tgz

# Or install from directory
npm install -g /path/to/claude-usage-cli/
```

### Verification

```bash
# Check installation
claude-monitor --version

# Test basic functionality
claude-monitor --help
claude-monitor summary
```

### Requirements

- **Node.js**: Version 14.0.0 or higher
- **NPM**: For package installation
- **Claude CLI**: With local conversation data

### Zero Dependencies Verification

```bash
# Verify no external dependencies
npm list --depth=0

# Should show only claude-usage-cli with no dependencies
```

### Usage After Installation

```bash
# Basic usage
claude-monitor                    # Show summary
claude-monitor projects           # List projects
claude-monitor today              # Today's usage
claude-monitor --timezone UTC     # Use UTC timezone

# For help
claude-monitor --help
```

### Uninstallation

```bash
# Uninstall global package
npm uninstall -g claude-usage-cli
```

### Troubleshooting

#### Permission Issues
```bash
# If you get permission errors, use:
sudo npm install -g claude-usage-cli

# Or configure npm to use a different directory
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'
export PATH=~/.npm-global/bin:$PATH
```

#### Node.js Version
```bash
# Check Node.js version
node --version

# Should be >= 14.0.0
```

#### Configuration Directory
```bash
# Check if Claude config exists
ls ~/.config/claude/projects/

# Use custom directory if needed
claude-monitor --config-dir /custom/path/to/claude
```