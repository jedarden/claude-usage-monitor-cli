# Changelog

All notable changes to Claude Usage Monitor CLI will be documented in this file.

## [1.0.0] - 2025-01-21

### Added
- Initial release based on [Claude-Code-Usage-Monitor](https://github.com/Maciek-roboblog/Claude-Code-Usage-Monitor)
- Zero-dependency Python package distributable via pip
- Zero-dependency Node.js package distributable via npm
- Direct JSONL file reading from Claude's data directory
- Built-in timezone support without external dependencies
- Custom ANSI color and progress bar implementations
- Cross-platform compatibility (Windows, macOS, Linux)
- Comprehensive testing framework
- Professional CLI interface with help documentation

### Changed from Original
- Removed ccusage npm package dependency
- Removed pytz Python dependency
- Removed all Node.js dependencies (commander, chalk, cli-progress, moment-timezone)
- Replaced subprocess calls with direct file I/O
- Implemented native timezone support
- Created modular package structure

### Credits
Based on the original work by Maciej ([@Maciek-roboblog](https://github.com/Maciek-roboblog)) - maciek@roboblog.eu