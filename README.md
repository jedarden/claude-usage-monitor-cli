# 📊 Claude Usage Monitor CLI

**Professional CLI tool for monitoring Claude AI token usage - Zero dependencies, easy installation**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Python](https://img.shields.io/badge/Python-3.7+-blue.svg)](https://www.python.org/)
[![Node.js](https://img.shields.io/badge/Node.js-14+-green.svg)](https://nodejs.org/)

## 🚀 **Quick Start**

### **Option 1: Python (pip)**
```bash
pip install claude-usage-monitor
claude-monitor
```

### **Option 2: Node.js (npm)**
```bash
npm install -g claude-usage-monitor  
claude-monitor
```

**That's it!** No additional dependencies, no complex setup, no Node.js↔Python bridges.

## ✨ **Features**

- 📊 **Real-time token monitoring** with visual progress bars
- 🔮 **Smart predictions** based on usage patterns
- 🎯 **Multi-plan support** (Pro, Max5, Max20, Custom)
- 🌍 **Timezone handling** for accurate reset times
- 🎨 **Beautiful terminal UI** with colors and emojis
- ⚡ **Zero external dependencies** - completely self-contained
- 🔄 **Auto-refresh** every 3 seconds
- 📱 **Cross-platform** (Windows, macOS, Linux)

## 📋 **Usage**

```bash
# Default monitoring (Pro plan)
claude-monitor

# Monitor with Max5 plan
claude-monitor --plan max5

# Custom timezone and reset hour
claude-monitor --plan max20 --timezone US/Eastern --reset-hour 9

# Show help
claude-monitor --help
```

## 🎯 **Why This Tool?**

**Before**: Complex installation with multiple dependencies
```bash
npm install -g ccusage
git clone https://github.com/Maciek-roboblog/Claude-Code-Usage-Monitor.git
cd Claude-Code-Usage-Monitor  
python3 -m venv venv && source venv/bin/activate
pip install pytz
python ccusage_monitor.py --plan max5
```

**After**: Single command installation
```bash
pip install claude-usage-monitor
claude-monitor --plan max5
```

## 🏗️ **Architecture**

This project provides **identical functionality** through two self-contained packages:

### **Python Package**
- **Zero dependencies** - uses built-in `datetime` instead of `pytz`
- **Direct file reading** - reads Claude's JSONL logs directly
- **Native CLI** - uses `argparse` for command-line interface

### **Node.js Package**  
- **Zero dependencies** - uses built-in APIs instead of external packages
- **Direct file reading** - accesses Claude's data directory directly
- **Native utilities** - custom progress bars, ANSI colors, timezone handling

Both packages:
- Read Claude Code's conversation logs directly (`~/.config/claude/projects/`)
- Parse usage data without external API calls
- Provide identical CLI interfaces and functionality
- Work completely offline

## 📊 **What It Monitors**

- **Token usage** per 5-hour blocks (Claude's billing windows)
- **Active sessions** vs completed sessions
- **Usage predictions** based on burn rate
- **Multiple plan types** with automatic limit detection
- **Reset times** based on your timezone

## 🔧 **Development**

### **Repository Structure**
```
claude-usage-monitor-cli/
├── python/              # Python package source
│   ├── claude_monitor/
│   │   ├── cli.py      # CLI interface
│   │   ├── monitor.py  # Core monitoring
│   │   └── utils/      # Utilities (no external deps)
│   └── pyproject.toml
├── nodejs/              # Node.js package source  
│   ├── lib/
│   │   ├── cli.js      # CLI interface
│   │   ├── monitor.js  # Core monitoring
│   │   └── utils/      # Utilities (no external deps)
│   └── package.json
└── shared/              # Shared documentation
```

### **Building**
```bash
# Build Python package
cd python && python -m build

# Build Node.js package
cd nodejs && npm pack
```

## 📄 **License**

MIT License - see [LICENSE](LICENSE) file for details.

**Original work**: Based on [Claude-Code-Usage-Monitor](https://github.com/Maciek-roboblog/Claude-Code-Usage-Monitor) by Maciej

## 🤝 **Contributing**

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test both Python and Node.js packages
5. Submit a pull request

## 🐛 **Issues & Support**

- **Issues**: [GitHub Issues](https://github.com/your-username/claude-usage-monitor-cli/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-username/claude-usage-monitor-cli/discussions)

---

**Transform your Claude usage monitoring experience from complex to simple! 🎉**