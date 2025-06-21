# Claude Usage Monitor (Python Package)

Professional CLI tool for monitoring Claude AI token usage with **zero external dependencies**.

## Credits & Attribution

This package is based on the original **[Claude-Code-Usage-Monitor](https://github.com/Maciek-roboblog/Claude-Code-Usage-Monitor)** by **[Maciej](https://github.com/Maciek-roboblog)** (maciek@roboblog.eu). This version transforms it into a zero-dependency pip-installable package while maintaining all original functionality.

## Installation

```bash
pip install claude-usage-cli
```

## Quick Start

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

## Features

- 📊 **Real-time token monitoring** with visual progress bars
- 🔮 **Smart predictions** based on usage patterns
- 🎯 **Multi-plan support** (Pro, Max5, Max20, Custom)
- 🌍 **Timezone handling** for accurate reset times
- 🎨 **Beautiful terminal UI** with colors and emojis
- ⚡ **Zero external dependencies** - completely self-contained
- 🔄 **Auto-refresh** every 3 seconds
- 📱 **Cross-platform** (Windows, macOS, Linux)

## Commands

```bash
# Basic usage
claude-monitor                          # Start monitoring with Pro plan
claude-monitor --plan max5              # Monitor with Max5 plan
claude-monitor --once                   # Run once and exit
claude-monitor --summary                # Show summary only

# Configuration
claude-monitor --list-plans             # Show available plans
claude-monitor --list-timezones         # Show timezone options
claude-monitor --info                   # Show configuration info

# Customization
claude-monitor --timezone US/Pacific    # Set timezone
claude-monitor --reset-hour 10          # Set reset hour
claude-monitor --refresh 5              # Set refresh interval
claude-monitor --no-color               # Disable colors
```

## Plans Supported

- **Pro**: 40 conversations per 5 hours, 200 daily
- **Max5**: 5 conversations per 5 hours, 30 daily  
- **Max20**: 20 conversations per 5 hours, 100 daily
- **Custom**: Configurable limits

## How It Works

This package reads Claude's conversation logs directly from your local filesystem:

- **Location**: `~/.config/claude/projects/` (Unix) or `%APPDATA%\claude\` (Windows)
- **Format**: JSONL files containing conversation data
- **Processing**: Extracts token usage and groups into 5-hour billing windows
- **Predictions**: Analyzes usage patterns to predict future consumption

## Zero Dependencies

This package uses only Python's built-in libraries:

- `datetime` for timezone handling (no pytz needed)
- `json` for parsing JSONL files
- `argparse` for CLI interface
- `os`/`sys` for system operations

## Requirements

- Python 3.7+
- Claude Desktop installed and used at least once
- Access to Claude's local data directory

## Development

```bash
# Clone repository
git clone <repository-url>
cd claude-usage-cli/python

# Install in development mode
pip install -e .

# Run directly
python -m claude_monitor.cli --help
```

## License

MIT License - see LICENSE file for details.