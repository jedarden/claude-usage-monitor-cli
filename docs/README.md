# Claude Usage Monitor CLI Documentation

## Table of Contents
- [Installation](../README.md#-quick-start)
- [Usage](../README.md#-usage)
- [Architecture](../README.md#-architecture)
- [Development](../CONTRIBUTING.md)
- [Attribution](../ATTRIBUTION.md)
- [License](../LICENSE)

## Detailed Documentation

### Configuration
The monitor reads Claude's conversation logs from:
- **Unix/macOS**: `~/.claude/projects/`
- **Windows**: `%APPDATA%\claude\projects\`

### Data Format
Claude stores conversations in JSONL (JSON Lines) format. Each line contains:
- Session information
- Token usage data (input, output, cache)
- Timestamps
- Model information

### Zero-Dependency Implementation
Both packages implement all functionality without external dependencies:

#### Python
- `datetime` for timezone handling (replaces pytz)
- `json` for JSONL parsing
- `argparse` for CLI
- `glob` for file discovery

#### Node.js
- `fs` for file operations
- `path` for file paths
- `readline` for JSONL parsing
- `Intl` API for timezone support

## Credits
Based on the original [Claude-Code-Usage-Monitor](https://github.com/Maciek-roboblog/Claude-Code-Usage-Monitor) by Maciej.