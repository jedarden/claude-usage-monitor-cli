# Contributing to Claude Usage Monitor CLI

Thank you for your interest in contributing! This project maintains both Python and Node.js packages that provide identical functionality.

## 🏗️ Project Structure

```
claude-usage-monitor-cli/
├── python/              # Python package (pip install)
├── nodejs/              # Node.js package (npm install -g)
├── shared/              # Shared documentation and resources
└── tests/               # Cross-platform integration tests
```

## 🚀 Development Setup

### Python Package
```bash
cd python/
python3 -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -e .
```

### Node.js Package
```bash
cd nodejs/
npm install -g .
```

## 🧪 Testing

### Python Tests
```bash
cd python/
python3 -m pytest tests/
python3 -m claude_monitor --help
```

### Node.js Tests
```bash
cd nodejs/
npm test
claude-monitor --help
```

### Cross-Platform Tests
```bash
./test-both-packages.sh
```

## 📋 Contribution Guidelines

### Code Changes
1. **Maintain Feature Parity**: Changes to one package must be reflected in the other
2. **Zero Dependencies**: Do not add external dependencies
3. **Cross-Platform**: Test on Windows, macOS, and Linux
4. **Backward Compatibility**: Preserve existing CLI interface

### Pull Request Process
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make changes to both Python and Node.js packages if applicable
4. Test both packages thoroughly
5. Update documentation
6. Commit changes (`git commit -m 'Add amazing feature'`)
7. Push to branch (`git push origin feature/amazing-feature`)
8. Open a Pull Request

### Code Style
- **Python**: Follow PEP 8, use type hints
- **Node.js**: Use ES6+, consistent with existing code
- **Documentation**: Update README and inline comments

## 🐛 Bug Reports

Include:
- Operating system and version
- Python/Node.js version
- Package installation method
- Complete error message
- Steps to reproduce

## 💡 Feature Requests

Please check existing issues before submitting new feature requests.

## 📄 License

By contributing, you agree that your contributions will be licensed under the MIT License.

## 🤝 Code of Conduct

- Be respectful and inclusive
- Focus on constructive feedback
- Help maintain a welcoming environment for all contributors