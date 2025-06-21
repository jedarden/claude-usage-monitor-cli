# Contributing to Claude Usage Monitor CLI

Thank you for your interest in contributing to Claude Usage Monitor CLI\! This project is based on the original work by Maciej and aims to make Claude usage monitoring more accessible.

## Development Setup

### Prerequisites
- Python 3.7+ for the Python package
- Node.js 14+ for the Node.js package
- Git

### Getting Started

1. Fork the repository
2. Clone your fork:
   ```bash
   git clone https://github.com/your-username/claude-usage-monitor-cli.git
   cd claude-usage-monitor-cli
   ```

3. Create a branch for your feature:
   ```bash
   git checkout -b feature/your-feature-name
   ```

## Development Guidelines

### Key Principles
- **Zero Dependencies**: Both packages must remain zero-dependency. Use only built-in modules.
- **Feature Parity**: Keep both Python and Node.js versions functionally identical
- **Original Functionality**: Preserve all features from the original Claude-Code-Usage-Monitor

### Python Package Development

```bash
cd python

# Install in development mode
pip install -e .

# Run directly
python -m claude_monitor.cli --help

# Build package
python -m build
```

### Node.js Package Development

```bash
cd nodejs

# Install dependencies (none should be added)
npm install

# Run directly
node lib/cli.js --help

# Run tests
npm test
```

## Testing

### Manual Testing
1. Ensure Claude Desktop is installed and has been used
2. Test all commands and options
3. Verify cross-platform compatibility

### Automated Testing
- Python: Uses built-in unittest
- Node.js: Uses built-in assert module

## Submitting Changes

1. Ensure your code follows the existing style
2. Test both packages thoroughly
3. Update documentation if needed
4. Submit a pull request with a clear description

## Code of Conduct

- Be respectful and constructive
- Credit the original author (Maciej) appropriately
- Maintain the MIT license requirements

## Questions?

Feel free to open an issue for discussion or clarification.

## Credits

This project is based on [Claude-Code-Usage-Monitor](https://github.com/Maciek-roboblog/Claude-Code-Usage-Monitor) by Maciej (maciek@roboblog.eu).
EOF < /dev/null
