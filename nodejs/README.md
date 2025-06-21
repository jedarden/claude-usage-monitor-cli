# Claude Usage Monitor

A completely self-contained Node.js package for monitoring Claude API usage with **zero external dependencies**.

## Credits & Attribution

This package is based on the original **[Claude-Code-Usage-Monitor](https://github.com/Maciek-roboblog/Claude-Code-Usage-Monitor)** by **[Maciej](https://github.com/Maciek-roboblog)** (maciek@roboblog.eu). This version transforms it into a zero-dependency npm package while maintaining all original functionality.

## Features

- 📊 **Zero Dependencies**: Pure Node.js implementation
- 🚀 **Direct File Access**: Reads Claude JSONL files directly (no external tools)
- 🌍 **Timezone Support**: Built-in Intl API for timezone handling
- 🎨 **Rich Terminal UI**: ANSI colors, progress bars, and formatted tables
- 📈 **Comprehensive Analytics**: Project-wise usage tracking and summaries
- ⚡ **Fast & Lightweight**: Native argument parsing and caching

## Installation

### Global Installation
```bash
npm install -g claude-usage-cli
```

### Local Installation
```bash
npm install claude-usage-cli
```

## Usage

### Command Line Interface

```bash
# Show overall usage summary
claude-usage-cli

# Show today's usage
claude-usage-cli today

# Show this week's usage
claude-usage-cli week

# Show this month's usage
claude-usage-cli month

# List all projects
claude-usage-cli projects

# Show specific project details
claude-usage-cli project my-project-id

# Use different timezone
claude-usage-cli --timezone "America/New_York"

# Quiet mode (minimal output)
claude-usage-cli --quiet summary

# Show help
claude-usage-cli --help
```

### Available Commands

- `summary` - Show overall usage summary (default)
- `project <id>` - Show detailed usage for a specific project
- `projects` - List all projects with usage statistics
- `today` - Show today's usage
- `week` - Show this week's usage
- `month` - Show this month's usage
- `cache [clear|stats]` - Manage internal cache

### Options

- `-t, --timezone <tz>` - Timezone for date formatting (default: system)
- `-c, --config-dir <dir>` - Claude configuration directory
- `-p, --project-id <id>` - Specific project ID to analyze
- `-v, --verbose` - Verbose output
- `-q, --quiet` - Quiet mode - minimal output
- `--no-color` - Disable colored output
- `--include-empty` - Include projects with no usage
- `-h, --help` - Show help message
- `--version` - Show version information

## Architecture

### Zero Dependencies Implementation

This package is completely self-contained and implements all functionality using only Node.js built-in modules:

#### Core Modules
- `lib/cli.js` - Main CLI interface
- `lib/monitor.js` - Core monitoring logic

#### Utilities (Zero Dependencies)
- `utils/args.js` - Native argument parsing
- `utils/terminal.js` - ANSI colors, progress bars, tables
- `utils/timezone.js` - Intl API timezone handling  
- `utils/claude-data.js` - Direct JSONL file parsing

### Data Sources

The monitor reads directly from Claude's local configuration:
- **Default Location**: `~/.config/claude/projects/`
- **File Format**: JSONL (JSON Lines) conversation files
- **Cache**: Built-in memory cache with configurable timeout

### Supported Data

- Total tokens (input + output)
- Input tokens
- Output tokens  
- Cache creation tokens
- Cache read tokens
- Request counts
- Model information
- Time ranges
- Project statistics

## API Usage

```javascript
const { ClaudeUsageMonitor } = require('claude-usage-cli');

const monitor = new ClaudeUsageMonitor({
    timezone: 'UTC',
    verbose: false
});

// Get usage summary
const summary = await monitor.getSummary();
console.log(summary.formatted);

// Get project details
const project = await monitor.getProjectDetails('my-project');
console.log(project.formatted);

// List all projects
const projects = await monitor.listProjects();
console.log(projects.formatted);
```

## Testing

```bash
# Run built-in tests
npm test

# Test CLI directly
node lib/cli.js --help
node lib/cli.js summary
./bin/claude-usage-cli --version
```

## Configuration

### Environment Variables

- `NODE_ENV=development` - Enable debug output and stack traces

### Custom Configuration Directory

```bash
claude-usage-cli --config-dir /custom/path/to/claude/config
```

## Requirements

- **Node.js**: >= 16.0.0
- **OS**: Linux, macOS, Windows
- **Claude CLI**: Local conversation files in JSONL format

## License

MIT License

## Contributing

This is a zero-dependency package. Please ensure any contributions maintain this requirement and use only Node.js built-in modules.