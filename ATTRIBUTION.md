# Attribution

## Original Work

This project is based on and derived from:

**Claude-Code-Usage-Monitor**
- **Repository**: https://github.com/Maciek-roboblog/Claude-Code-Usage-Monitor
- **Author**: Maciej ([@Maciek-roboblog](https://github.com/Maciek-roboblog))
- **Email**: maciek@roboblog.eu
- **License**: MIT License
- **Original Release**: 2025

## Original Functionality

The original Claude-Code-Usage-Monitor provided:
- Real-time monitoring of Claude AI token usage
- Visual progress bars and terminal UI
- Usage predictions based on burn rate
- Multi-plan support (Pro, Max5, Max20)
- 5-hour billing window tracking
- Timezone configuration and session management

## Modifications and Enhancements

This fork transforms the original project into zero-dependency CLI packages by:

### Removed Dependencies
- Eliminated `ccusage` npm package dependency
- Removed `pytz` Python dependency
- Removed all Node.js dependencies (commander, chalk, cli-progress, moment-timezone)

### Added Functionality
- Direct JSONL file reading from Claude's data directory
- Built-in timezone handling using native APIs
- Custom ANSI color and progress bar implementations
- Dual distribution via pip and npm
- Comprehensive testing framework
- Cross-platform compatibility improvements

### Technical Changes
- Replaced subprocess calls to ccusage with direct file I/O
- Implemented native timezone support (Python datetime, JavaScript Intl)
- Created custom terminal UI utilities
- Added modular package structure for both Python and Node.js

## License Compliance

This project maintains the MIT License from the original work, as required. All modifications and enhancements are also released under the MIT License, preserving the open-source nature of the original project.

## Acknowledgments

Special thanks to Maciej for creating the original Claude-Code-Usage-Monitor and making it open source. This project would not exist without their foundational work in understanding Claude's usage patterns and creating an effective monitoring solution.

The goal of this fork is to make the excellent functionality of the original tool more accessible to users by simplifying installation while maintaining all the features that made it valuable to the Claude AI community.