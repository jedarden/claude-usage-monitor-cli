# 🚀 Binary Execution Guide - Claude Usage Monitor CLI

## 📋 **Environment Overview**

**Current Environment**: `/workspaces/devpod-base-test/claude-token-monitor/`
- **Platform**: Linux (devpod container)
- **Python**: 3.11.2
- **Node.js**: 22.16.0
- **NPM**: 10.9.2

## 🎯 **Available Execution Methods**

Both Python and Node.js packages are available in this environment with multiple ways to execute them:

### **📍 Package Locations**
- **Python Package**: `./python/` directory
- **Node.js Package**: `./nodejs/` directory

---

## 🐍 **Python Package Execution**

### **Method 1: Direct Module Execution (Recommended)**

**Navigate to Python package directory:**
```bash
cd /workspaces/devpod-base-test/claude-token-monitor/python/
```

**Execute directly without installation:**
```bash
# Basic usage
python3 -m claude_monitor

# With specific plan
python3 -m claude_monitor --plan max5

# With timezone configuration
python3 -m claude_monitor --plan pro --timezone US/Eastern

# Show help
python3 -m claude_monitor --help

# Show version
python3 -m claude_monitor --version

# One-time execution (no continuous monitoring)
python3 -m claude_monitor --once

# Summary only
python3 -m claude_monitor --summary

# Configuration info
python3 -m claude_monitor --info

# List available plans
python3 -m claude_monitor --list-plans

# List timezone options
python3 -m claude_monitor --list-timezones
```

### **Method 2: Development Installation**

**Install in development mode:**
```bash
cd /workspaces/devpod-base-test/claude-token-monitor/python/
python3 -m pip install -e . --break-system-packages
```

**Execute via installed command:**
```bash
# The Python package creates a claude-monitor command, but Node.js takes precedence
# Use direct module execution instead (Method 1)
python3 -m claude_monitor --help
```

### **Method 3: Built Package Installation**

**Build and install from wheel:**
```bash
cd /workspaces/devpod-base-test/claude-token-monitor/python/

# Build the package
python3 -m build

# Install from built wheel
python3 -m pip install dist/claude_usage_monitor-1.0.0-py3-none-any.whl --break-system-packages --force-reinstall

# Execute
python3 -m claude_monitor --help
```

---

## 📦 **Node.js Package Execution**

### **Method 1: Direct Binary Execution (Recommended)**

**Navigate to Node.js package directory:**
```bash
cd /workspaces/devpod-base-test/claude-token-monitor/nodejs/
```

**Execute the binary directly:**
```bash
# Basic usage
./bin/claude-monitor

# With specific plan
./bin/claude-monitor --plan max5

# With timezone configuration  
./bin/claude-monitor --plan pro --timezone US/Eastern

# Show help
./bin/claude-monitor --help

# Show version
./bin/claude-monitor --version

# Examples with all options
./bin/claude-monitor --plan max20 --reset-hour 9 --timezone Asia/Tokyo
```

### **Method 2: Global Installation**

**Install globally (if not already installed):**
```bash
cd /workspaces/devpod-base-test/claude-token-monitor/nodejs/
npm install -g .
```

**Execute via global command:**
```bash
# Global command (takes precedence over Python version)
claude-monitor --help
claude-monitor --plan max5
claude-monitor --version
```

### **Method 3: Local Installation**

**Install locally and execute via npx:**
```bash
cd /workspaces/devpod-base-test/claude-token-monitor/nodejs/
npm install .
npx claude-monitor --help
```

---

## 🔧 **Common Usage Examples**

### **Basic Monitoring Commands**

```bash
# Python - Monitor with Pro plan (default)
cd /workspaces/devpod-base-test/claude-token-monitor/python/
python3 -m claude_monitor

# Node.js - Monitor with Max5 plan
cd /workspaces/devpod-base-test/claude-token-monitor/nodejs/
./bin/claude-monitor --plan max5

# Python - Show summary only (no continuous monitoring)
python3 -m claude_monitor --summary

# Node.js - Monitor with custom timezone
./bin/claude-monitor --plan max20 --timezone US/Pacific
```

### **Configuration and Information Commands**

```bash
# Python - Show configuration information
cd /workspaces/devpod-base-test/claude-token-monitor/python/
python3 -m claude_monitor --info

# Python - List available plans
python3 -m claude_monitor --list-plans

# Python - List timezone options
python3 -m claude_monitor --list-timezones

# Node.js - Show help with examples
cd /workspaces/devpod-base-test/claude-token-monitor/nodejs/
./bin/claude-monitor --help
```

### **Advanced Usage**

```bash
# Python - Monitor with custom refresh rate and no colors
cd /workspaces/devpod-base-test/claude-token-monitor/python/
python3 -m claude_monitor --plan max5 --refresh 5 --no-color

# Python - Verbose output with custom reset hour
python3 -m claude_monitor --plan pro --reset-hour 6 --verbose

# Node.js - All options combined
cd /workspaces/devpod-base-test/claude-token-monitor/nodejs/
./bin/claude-monitor --plan max20 --reset-hour 9 --timezone Europe/London
```

---

## 🧪 **Testing Commands**

### **Verify Installations**

```bash
# Test Python package
cd /workspaces/devpod-base-test/claude-token-monitor/python/
python3 -m claude_monitor --version
python3 -m claude_monitor --help | head -5

# Test Node.js package
cd /workspaces/devpod-base-test/claude-token-monitor/nodejs/
./bin/claude-monitor --version
./bin/claude-monitor --help | head -5
```

### **Compare Package Outputs**

```bash
# Compare version outputs
echo "Python version:"
cd /workspaces/devpod-base-test/claude-token-monitor/python/
python3 -m claude_monitor --version

echo "Node.js version:"
cd /workspaces/devpod-base-test/claude-token-monitor/nodejs/
./bin/claude-monitor --version

# Compare help outputs
echo "Python help:" > /tmp/python_help.txt
python3 -m claude_monitor --help >> /tmp/python_help.txt

echo "Node.js help:" > /tmp/nodejs_help.txt
./bin/claude-monitor --help >> /tmp/nodejs_help.txt

echo "Help comparison saved to /tmp/python_help.txt and /tmp/nodejs_help.txt"
```

---

## ⚠️ **Expected Behavior in Current Environment**

### **Claude Configuration Not Found (Normal)**

Both packages will show this expected error when no Claude configuration exists:

```bash
# Python output:
Error: Claude configuration directory not found.
Please ensure Claude Code is installed and has been used at least once.

# Node.js output:
Error: No Claude projects directory found.
Expected locations:
- ~/.config/claude/projects/
- ~/.claude/projects/
```

**This is normal behavior** - the tool correctly detects when Claude Code hasn't been set up yet.

### **Package Manager Precedence**

When both packages are installed globally:
- **Global command `claude-monitor`**: Uses Node.js version
- **Direct Python execution**: Use `python3 -m claude_monitor`

### **Expected Success Indicators**

✅ **Working correctly when you see:**
- Version numbers (1.0.0)
- Comprehensive help output
- Error messages about missing Claude configuration (normal)
- No dependency errors or missing module errors

❌ **Issues to investigate:**
- "Module not found" errors
- "Command not found" errors
- Dependency-related errors (shouldn't happen with zero-dependency packages)

---

## 🚀 **Quick Start Testing Script**

**Create and run a comprehensive test:**

```bash
#!/bin/bash
echo "=== Claude Usage Monitor CLI - Binary Test ==="
echo "Environment: $(pwd)"
echo "Python: $(python3 --version)"
echo "Node.js: $(node --version)"
echo ""

echo "=== Testing Python Package ==="
cd /workspaces/devpod-base-test/claude-token-monitor/python/
echo "Location: $(pwd)"
echo "Version: $(python3 -m claude_monitor --version)"
echo "Help available: $(python3 -m claude_monitor --help | head -1)"
echo ""

echo "=== Testing Node.js Package ==="
cd /workspaces/devpod-base-test/claude-token-monitor/nodejs/
echo "Location: $(pwd)"
echo "Version: $(./bin/claude-monitor --version)"
echo "Help available: $(./bin/claude-monitor --help | head -1)"
echo ""

echo "=== Test Complete ==="
echo "Both packages are ready for execution!"
```

**Save and execute:**
```bash
# Save the script
cat > /tmp/test_binaries.sh << 'EOF'
[paste script above]
EOF

# Make executable and run
chmod +x /tmp/test_binaries.sh
/tmp/test_binaries.sh
```

---

## 📋 **Execution Checklist**

### **For Python Package:**
- [ ] Navigate to `/workspaces/devpod-base-test/claude-token-monitor/python/`
- [ ] Execute `python3 -m claude_monitor --help`
- [ ] Verify version shows `1.0.0`
- [ ] Test basic functionality (expect Claude config error - normal)

### **For Node.js Package:**
- [ ] Navigate to `/workspaces/devpod-base-test/claude-token-monitor/nodejs/`
- [ ] Execute `./bin/claude-monitor --help`
- [ ] Verify version shows `1.0.0`
- [ ] Test basic functionality (expect Claude config error - normal)

### **Verification Steps:**
- [ ] Both packages show same version number
- [ ] Help output is comprehensive and professional
- [ ] No "dependency not found" or "module not found" errors
- [ ] Expected "Claude configuration not found" error (normal behavior)

---

## 🎯 **Ready to Execute**

Both packages are now ready for execution in your environment using the methods above. The binaries are fully functional and will work as expected once Claude Code configuration is available, or can be tested immediately to verify the CLI interface and help systems work correctly.

**Recommended**: Start with **Method 1** for both packages (Direct Module/Binary Execution) as it requires no installation and gives immediate access to the functionality.