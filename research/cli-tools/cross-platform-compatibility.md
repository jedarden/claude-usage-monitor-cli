# Cross-Platform Compatibility Guide for CLI Tools

## Table of Contents
1. [Introduction](#introduction)
2. [Operating System Challenges](#operating-system-challenges)
3. [Shell Compatibility Matrix](#shell-compatibility-matrix)
4. [Path Handling](#path-handling)
5. [Terminal Capabilities](#terminal-capabilities)
6. [Unicode and Encoding](#unicode-and-encoding)
7. [Installation Paths](#installation-paths)
8. [Cross-Platform Code Examples](#cross-platform-code-examples)
9. [Testing Strategies](#testing-strategies)
10. [CI/CD Setup](#cicd-setup)

## Introduction

Building CLI tools that work seamlessly across Windows, macOS, and Linux requires careful consideration of platform-specific differences. This guide provides comprehensive strategies and solutions for ensuring cross-platform compatibility.

## Operating System Challenges

### Windows
- **Path separators**: Uses backslash (`\`) instead of forward slash (`/`)
- **Case sensitivity**: File system is case-insensitive
- **Line endings**: Uses CRLF (`\r\n`) instead of LF (`\n`)
- **Executable extensions**: Requires `.exe`, `.bat`, or `.cmd` extensions
- **Environment variables**: Different syntax (`%VAR%` vs `$VAR`)
- **Unicode support**: Limited in older versions and CMD

### macOS
- **Case sensitivity**: HFS+ is case-insensitive by default, APFS can be case-sensitive
- **System paths**: Different from Linux (e.g., `/usr/local` vs `/opt`)
- **BSD utilities**: Different flags and behaviors compared to GNU utilities
- **Quarantine attributes**: Security features that may block executables

### Linux
- **Distributions**: Wide variety with different package managers and conventions
- **Case sensitivity**: File system is case-sensitive
- **Permissions**: Strict file permission requirements
- **FHS compliance**: Expected directory structure varies by distribution

## Shell Compatibility Matrix

| Feature | Bash | Zsh | Fish | CMD | PowerShell |
|---------|------|-----|------|-----|------------|
| Variable syntax | `$VAR` | `$VAR` | `$VAR` | `%VAR%` | `$env:VAR` |
| Command substitution | `$(cmd)` | `$(cmd)` | `(cmd)` | N/A | `$(cmd)` |
| Glob patterns | `*.txt` | `*.txt` | `*.txt` | `*.txt` | `*.txt` |
| Pipes | `\|` | `\|` | `\|` | `\|` | `\|` |
| Redirection | `>`, `>>` | `>`, `>>` | `>`, `>>` | `>`, `>>` | `>`, `>>` |
| Background jobs | `&` | `&` | `&` | N/A | `&` |
| Aliases | Yes | Yes | Yes | Limited | Yes |
| Functions | Yes | Yes | Yes | No | Yes |

## Path Handling

### Python Example
```python
import os
import sys
from pathlib import Path

def get_cross_platform_path(path_str):
    """Convert path string to platform-appropriate format."""
    return Path(path_str).resolve()

def get_home_directory():
    """Get user home directory across platforms."""
    return Path.home()

def get_config_directory():
    """Get appropriate config directory for each platform."""
    if sys.platform == "win32":
        # Windows: %APPDATA%
        return Path(os.environ.get('APPDATA', Path.home() / 'AppData' / 'Roaming'))
    elif sys.platform == "darwin":
        # macOS: ~/Library/Application Support
        return Path.home() / 'Library' / 'Application Support'
    else:
        # Linux/Unix: ~/.config
        return Path(os.environ.get('XDG_CONFIG_HOME', Path.home() / '.config'))

def join_paths(*parts):
    """Join path parts safely across platforms."""
    return Path(*parts)

# Example usage
config_file = get_config_directory() / 'myapp' / 'config.json'
print(f"Config path: {config_file}")
```

### Node.js Example
```javascript
const path = require('path');
const os = require('os');
const fs = require('fs');

function getCrossPlatformPath(pathStr) {
    // Normalize path for current platform
    return path.resolve(pathStr);
}

function getHomeDirectory() {
    return os.homedir();
}

function getConfigDirectory() {
    const platform = process.platform;
    
    if (platform === 'win32') {
        // Windows: %APPDATA%
        return process.env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming');
    } else if (platform === 'darwin') {
        // macOS: ~/Library/Application Support
        return path.join(os.homedir(), 'Library', 'Application Support');
    } else {
        // Linux/Unix: ~/.config
        return process.env.XDG_CONFIG_HOME || path.join(os.homedir(), '.config');
    }
}

function joinPaths(...parts) {
    return path.join(...parts);
}

// Example usage
const configFile = path.join(getConfigDirectory(), 'myapp', 'config.json');
console.log(`Config path: ${configFile}`);
```

## Terminal Capabilities

### Detecting Terminal Support

#### Python Example
```python
import sys
import os
import platform
import shutil

def supports_color():
    """Check if terminal supports color output."""
    # Windows
    if sys.platform == 'win32':
        # Windows 10 build 10586+ supports ANSI colors
        try:
            import ctypes
            kernel32 = ctypes.windll.kernel32
            kernel32.SetConsoleMode(kernel32.GetStdHandle(-11), 7)
            return True
        except:
            return False
    
    # Unix-like systems
    if not hasattr(sys.stdout, 'isatty'):
        return False
    
    if not sys.stdout.isatty():
        return False
    
    # Check for various terminal types
    term = os.environ.get('TERM', '')
    if term == 'dumb':
        return False
    
    # Check for color support in environment
    if 'COLORTERM' in os.environ:
        return True
    
    if term.endswith('color') or term.endswith('256color'):
        return True
    
    return True

def get_terminal_size():
    """Get terminal dimensions safely."""
    try:
        return shutil.get_terminal_size(fallback=(80, 24))
    except:
        return (80, 24)

def clear_screen():
    """Clear terminal screen cross-platform."""
    if sys.platform == 'win32':
        os.system('cls')
    else:
        os.system('clear')

# ANSI color codes (with fallback)
class Colors:
    def __init__(self):
        if supports_color():
            self.RED = '\033[91m'
            self.GREEN = '\033[92m'
            self.YELLOW = '\033[93m'
            self.BLUE = '\033[94m'
            self.RESET = '\033[0m'
        else:
            self.RED = ''
            self.GREEN = ''
            self.YELLOW = ''
            self.BLUE = ''
            self.RESET = ''

colors = Colors()
print(f"{colors.GREEN}Success!{colors.RESET}")
```

#### Node.js Example
```javascript
const os = require('os');
const process = require('process');

function supportsColor() {
    // Disable color for non-TTY
    if (!process.stdout.isTTY) {
        return false;
    }
    
    // Windows
    if (process.platform === 'win32') {
        // Windows 10 build 10586+ supports ANSI colors
        const osRelease = os.release().split('.');
        if (parseInt(osRelease[0]) >= 10 && parseInt(osRelease[2]) >= 10586) {
            return true;
        }
        return false;
    }
    
    // Check TERM environment variable
    const term = process.env.TERM || '';
    if (term === 'dumb') {
        return false;
    }
    
    // Check for color support indicators
    if (process.env.COLORTERM) {
        return true;
    }
    
    if (term.includes('color')) {
        return true;
    }
    
    return true;
}

function getTerminalSize() {
    return {
        columns: process.stdout.columns || 80,
        rows: process.stdout.rows || 24
    };
}

function clearScreen() {
    if (process.platform === 'win32') {
        process.stdout.write('\x1Bc');
    } else {
        process.stdout.write('\033[2J\033[H');
    }
}

// Color support with fallback
const colors = supportsColor() ? {
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    reset: '\x1b[0m'
} : {
    red: '',
    green: '',
    yellow: '',
    blue: '',
    reset: ''
};

console.log(`${colors.green}Success!${colors.reset}`);
```

## Unicode and Encoding

### Handling Different Encodings

#### Python Example
```python
import sys
import locale
import codecs

def setup_unicode():
    """Configure proper Unicode handling."""
    # Set UTF-8 as default encoding
    if sys.platform == 'win32':
        # Enable UTF-8 mode on Windows
        import ctypes
        kernel32 = ctypes.windll.kernel32
        kernel32.SetConsoleCP(65001)
        kernel32.SetConsoleOutputCP(65001)
    
    # Ensure stdout/stderr handle Unicode
    if sys.stdout.encoding != 'utf-8':
        sys.stdout = codecs.getwriter('utf-8')(sys.stdout.buffer, 'strict')
    if sys.stderr.encoding != 'utf-8':
        sys.stderr = codecs.getwriter('utf-8')(sys.stderr.buffer, 'strict')

def safe_print(text):
    """Print text safely handling encoding errors."""
    try:
        print(text)
    except UnicodeEncodeError:
        # Fallback to ASCII representation
        print(text.encode('ascii', 'replace').decode('ascii'))

def read_file_universal(filepath):
    """Read file with automatic encoding detection."""
    import chardet
    
    # Try UTF-8 first
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            return f.read()
    except UnicodeDecodeError:
        pass
    
    # Detect encoding
    with open(filepath, 'rb') as f:
        raw_data = f.read()
        result = chardet.detect(raw_data)
        encoding = result['encoding']
    
    # Read with detected encoding
    with open(filepath, 'r', encoding=encoding) as f:
        return f.read()
```

#### Node.js Example
```javascript
const fs = require('fs');
const { promisify } = require('util');

function setupUnicode() {
    // Node.js handles UTF-8 by default, but ensure proper handling
    if (process.platform === 'win32') {
        // Enable Unicode on Windows console
        const { exec } = require('child_process');
        exec('chcp 65001', (err) => {
            if (err) console.error('Failed to set Unicode code page');
        });
    }
}

function safePrint(text) {
    try {
        console.log(text);
    } catch (error) {
        // Fallback to ASCII
        console.log(Buffer.from(text).toString('ascii'));
    }
}

async function readFileUniversal(filepath) {
    // Try UTF-8 first
    try {
        return await fs.promises.readFile(filepath, 'utf8');
    } catch (error) {
        if (error.code === 'ENOENT') throw error;
        
        // Try other encodings
        const encodings = ['utf16le', 'latin1', 'ascii'];
        for (const encoding of encodings) {
            try {
                return await fs.promises.readFile(filepath, encoding);
            } catch (e) {
                continue;
            }
        }
        
        // Return as buffer if all encodings fail
        return await fs.promises.readFile(filepath);
    }
}
```

## Installation Paths

### Platform-Specific Installation Locations

```python
import sys
import os
from pathlib import Path

def get_install_directories():
    """Get platform-specific installation directories."""
    if sys.platform == 'win32':
        return {
            'user_bin': Path.home() / 'AppData' / 'Local' / 'Programs',
            'system_bin': Path('C:\\Program Files'),
            'user_data': Path(os.environ.get('LOCALAPPDATA', Path.home() / 'AppData' / 'Local')),
            'system_data': Path(os.environ.get('PROGRAMDATA', 'C:\\ProgramData'))
        }
    elif sys.platform == 'darwin':
        return {
            'user_bin': Path.home() / 'Applications',
            'system_bin': Path('/Applications'),
            'user_data': Path.home() / 'Library' / 'Application Support',
            'system_data': Path('/Library/Application Support')
        }
    else:  # Linux/Unix
        return {
            'user_bin': Path.home() / '.local' / 'bin',
            'system_bin': Path('/usr/local/bin'),
            'user_data': Path(os.environ.get('XDG_DATA_HOME', Path.home() / '.local' / 'share')),
            'system_data': Path('/usr/share')
        }

def get_executable_extension():
    """Get platform-specific executable extension."""
    return '.exe' if sys.platform == 'win32' else ''

def make_executable(filepath):
    """Make file executable on Unix-like systems."""
    if sys.platform != 'win32':
        import stat
        os.chmod(filepath, os.stat(filepath).st_mode | stat.S_IEXEC)
```

## Cross-Platform Code Examples

### File Operations

#### Python Example
```python
import os
import sys
import tempfile
from pathlib import Path
import shutil

class CrossPlatformFileOps:
    @staticmethod
    def create_temp_file(suffix=''):
        """Create temporary file that works across platforms."""
        fd, path = tempfile.mkstemp(suffix=suffix)
        os.close(fd)  # Close file descriptor
        return Path(path)
    
    @staticmethod
    def create_temp_dir():
        """Create temporary directory."""
        return Path(tempfile.mkdtemp())
    
    @staticmethod
    def atomic_write(filepath, content):
        """Write file atomically (safe on all platforms)."""
        filepath = Path(filepath)
        temp_file = filepath.with_suffix('.tmp')
        
        try:
            # Write to temporary file
            with open(temp_file, 'w', encoding='utf-8') as f:
                f.write(content)
            
            # Windows requires special handling for file replacement
            if sys.platform == 'win32':
                if filepath.exists():
                    filepath.unlink()
                temp_file.rename(filepath)
            else:
                # POSIX systems support atomic rename
                temp_file.replace(filepath)
        except Exception:
            if temp_file.exists():
                temp_file.unlink()
            raise
    
    @staticmethod
    def copy_preserving_metadata(src, dst):
        """Copy file preserving metadata across platforms."""
        shutil.copy2(src, dst)
    
    @staticmethod
    def get_file_info(filepath):
        """Get cross-platform file information."""
        stat = os.stat(filepath)
        return {
            'size': stat.st_size,
            'modified': stat.st_mtime,
            'created': getattr(stat, 'st_birthtime', stat.st_ctime),
            'is_executable': os.access(filepath, os.X_OK)
        }
```

### Process Management

#### Python Example
```python
import subprocess
import sys
import shlex
import os

class CrossPlatformProcess:
    @staticmethod
    def run_command(cmd, shell=False):
        """Run command with cross-platform support."""
        if isinstance(cmd, str) and not shell:
            # Split command string appropriately
            if sys.platform == 'win32':
                cmd = cmd.split()
            else:
                cmd = shlex.split(cmd)
        
        # Set up environment
        env = os.environ.copy()
        if sys.platform == 'win32':
            # Ensure Windows uses UTF-8
            env['PYTHONIOENCODING'] = 'utf-8'
        
        try:
            result = subprocess.run(
                cmd,
                shell=shell,
                capture_output=True,
                text=True,
                env=env,
                timeout=30  # Prevent hanging
            )
            return result
        except subprocess.TimeoutExpired:
            raise TimeoutError(f"Command timed out: {cmd}")
    
    @staticmethod
    def find_executable(name):
        """Find executable in PATH."""
        if sys.platform == 'win32':
            # Windows: try with common extensions
            extensions = ['.exe', '.cmd', '.bat', '']
            for ext in extensions:
                exe = shutil.which(name + ext)
                if exe:
                    return exe
        else:
            return shutil.which(name)
        return None
    
    @staticmethod
    def open_file_with_default_app(filepath):
        """Open file with system default application."""
        if sys.platform == 'win32':
            os.startfile(filepath)
        elif sys.platform == 'darwin':
            subprocess.run(['open', filepath])
        else:  # Linux/Unix
            subprocess.run(['xdg-open', filepath])
```

### Environment Variables

#### Python Example
```python
import os
import sys
from pathlib import Path

class CrossPlatformEnv:
    @staticmethod
    def get_path_separator():
        """Get PATH environment variable separator."""
        return ';' if sys.platform == 'win32' else ':'
    
    @staticmethod
    def add_to_path(directory):
        """Add directory to PATH temporarily."""
        sep = CrossPlatformEnv.get_path_separator()
        current_path = os.environ.get('PATH', '')
        os.environ['PATH'] = f"{directory}{sep}{current_path}"
    
    @staticmethod
    def expand_env_vars(path_str):
        """Expand environment variables in path."""
        return os.path.expandvars(os.path.expanduser(path_str))
    
    @staticmethod
    def get_standard_dirs():
        """Get standard directories across platforms."""
        dirs = {
            'home': Path.home(),
            'temp': Path(tempfile.gettempdir()),
            'cwd': Path.cwd()
        }
        
        if sys.platform == 'win32':
            dirs['desktop'] = Path.home() / 'Desktop'
            dirs['documents'] = Path.home() / 'Documents'
        elif sys.platform == 'darwin':
            dirs['desktop'] = Path.home() / 'Desktop'
            dirs['documents'] = Path.home() / 'Documents'
        else:  # Linux
            # Follow XDG Base Directory Specification
            dirs['desktop'] = Path.home() / 'Desktop'
            dirs['documents'] = Path.home() / 'Documents'
            dirs['cache'] = Path(os.environ.get('XDG_CACHE_HOME', Path.home() / '.cache'))
        
        return dirs
```

## Testing Strategies

### Multi-Platform Testing Framework

```python
import sys
import platform
import pytest
import tempfile
from pathlib import Path

class TestCrossPlatform:
    @pytest.fixture
    def temp_dir(self):
        """Create temporary directory for tests."""
        with tempfile.TemporaryDirectory() as tmpdir:
            yield Path(tmpdir)
    
    def test_path_operations(self, temp_dir):
        """Test path operations work correctly."""
        # Test path joining
        result = temp_dir / 'subdir' / 'file.txt'
        assert str(result).endswith('file.txt')
        
        # Test path normalization
        messy_path = temp_dir / '..' / temp_dir.name / 'file.txt'
        clean_path = messy_path.resolve()
        assert clean_path.parent == temp_dir
    
    @pytest.mark.skipif(sys.platform == 'win32', reason="Unix-specific test")
    def test_unix_permissions(self, temp_dir):
        """Test Unix file permissions."""
        test_file = temp_dir / 'test.sh'
        test_file.write_text('#!/bin/bash\necho "test"')
        
        # Make executable
        import stat
        test_file.chmod(test_file.stat().st_mode | stat.S_IEXEC)
        assert os.access(test_file, os.X_OK)
    
    @pytest.mark.skipif(sys.platform != 'win32', reason="Windows-specific test")
    def test_windows_paths(self):
        """Test Windows-specific path handling."""
        # Test UNC paths
        unc_path = Path('//server/share/file.txt')
        assert unc_path.is_absolute()
        
        # Test drive letters
        drive_path = Path('C:/Users/test')
        assert drive_path.is_absolute()
    
    def test_line_endings(self, temp_dir):
        """Test line ending handling."""
        test_file = temp_dir / 'test.txt'
        
        # Write with universal newlines
        with open(test_file, 'w', newline='') as f:
            f.write('line1\nline2\n')
        
        # Read back
        content = test_file.read_text()
        assert 'line1' in content and 'line2' in content
    
    @pytest.mark.parametrize('platform_name', ['win32', 'darwin', 'linux'])
    def test_platform_detection(self, monkeypatch, platform_name):
        """Test platform detection logic."""
        monkeypatch.setattr(sys, 'platform', platform_name)
        
        if platform_name == 'win32':
            assert sys.platform == 'win32'
        elif platform_name == 'darwin':
            assert sys.platform == 'darwin'
        else:
            assert platform_name == 'linux'
```

### Testing Shell Scripts

```bash
#!/bin/bash
# test_cross_platform.sh

# Function to test command availability
test_command() {
    if command -v "$1" >/dev/null 2>&1; then
        echo "✓ $1 is available"
        return 0
    else
        echo "✗ $1 is not available"
        return 1
    fi
}

# Test shell detection
echo "Shell: $SHELL"
echo "OS: $(uname -s)"

# Test common commands
commands=("python" "python3" "node" "npm" "git")
for cmd in "${commands[@]}"; do
    test_command "$cmd"
done

# Test path handling
test_paths() {
    local test_dir="/tmp/cli_test_$$"
    mkdir -p "$test_dir"
    
    # Test file creation
    touch "$test_dir/test.txt"
    [ -f "$test_dir/test.txt" ] && echo "✓ File creation works"
    
    # Cleanup
    rm -rf "$test_dir"
}

test_paths
```

## CI/CD Setup

### GitHub Actions Configuration

```yaml
# .github/workflows/cross-platform-test.yml
name: Cross-Platform Tests

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    strategy:
      matrix:
        os: [ubuntu-latest, windows-latest, macos-latest]
        python-version: ['3.8', '3.9', '3.10', '3.11']
        node-version: ['14', '16', '18']
        
    runs-on: ${{ matrix.os }}
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Set up Python
      uses: actions/setup-python@v4
      with:
        python-version: ${{ matrix.python-version }}
    
    - name: Set up Node.js
      uses: actions/setup-node@v3
      with:
        node-version: ${{ matrix.node-version }}
    
    - name: Install Python dependencies
      run: |
        python -m pip install --upgrade pip
        pip install pytest pytest-cov
        pip install -e .
    
    - name: Install Node dependencies
      run: |
        npm install
        npm run build
    
    - name: Run Python tests
      run: |
        pytest tests/ -v --cov=mypackage
      env:
        PYTHONIOENCODING: utf-8
    
    - name: Run Node tests
      run: npm test
    
    - name: Test CLI installation
      run: |
        # Test Python CLI
        python -m mypackage --version
        
        # Test Node CLI
        npm link
        mycli --version
    
    - name: Test shell scripts (Unix)
      if: runner.os != 'Windows'
      run: |
        chmod +x scripts/*.sh
        ./scripts/test.sh
    
    - name: Test batch scripts (Windows)
      if: runner.os == 'Windows'
      run: |
        scripts\test.bat
    
    - name: Upload coverage
      uses: codecov/codecov-action@v3
      with:
        file: ./coverage.xml
        flags: ${{ matrix.os }}-py${{ matrix.python-version }}

  integration-test:
    needs: test
    runs-on: ${{ matrix.os }}
    strategy:
      matrix:
        os: [ubuntu-latest, windows-latest, macos-latest]
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Build packages
      run: |
        # Build Python package
        python -m pip install build
        python -m build
        
        # Build Node package
        npm pack
    
    - name: Test installation
      run: |
        # Create test environment
        python -m venv test_env
        
        # Activate environment (platform-specific)
        if [[ "$RUNNER_OS" == "Windows" ]]; then
          source test_env/Scripts/activate
        else
          source test_env/bin/activate
        fi
        
        # Install and test
        pip install dist/*.whl
        mycli --help
```

### Docker Multi-Platform Testing

```dockerfile
# Dockerfile.test
FROM python:3.9-slim as base

# Install common dependencies
RUN apt-get update && apt-get install -y \
    git \
    curl \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Install Node.js
RUN curl -fsSL https://deb.nodesource.com/setup_16.x | bash - \
    && apt-get install -y nodejs

# Create test user
RUN useradd -m testuser

# Copy application
WORKDIR /app
COPY . .

# Install dependencies
RUN pip install -e . && npm install

# Switch to test user
USER testuser

# Run tests
CMD ["python", "-m", "pytest", "-v"]
```

### Testing Matrix Script

```python
#!/usr/bin/env python3
"""
Cross-platform testing matrix runner
"""
import subprocess
import sys
import platform
from pathlib import Path

class TestMatrix:
    def __init__(self):
        self.results = []
    
    def run_test(self, name, command):
        """Run a single test."""
        print(f"\nRunning: {name}")
        print(f"Command: {command}")
        print("-" * 50)
        
        try:
            result = subprocess.run(
                command,
                shell=True,
                capture_output=True,
                text=True,
                timeout=300
            )
            
            success = result.returncode == 0
            self.results.append({
                'name': name,
                'success': success,
                'output': result.stdout,
                'error': result.stderr
            })
            
            if success:
                print("✓ PASSED")
            else:
                print("✗ FAILED")
                print(f"Error: {result.stderr}")
                
        except subprocess.TimeoutExpired:
            print("✗ TIMEOUT")
            self.results.append({
                'name': name,
                'success': False,
                'output': '',
                'error': 'Test timed out'
            })
    
    def run_all_tests(self):
        """Run all cross-platform tests."""
        # Platform info
        print(f"Platform: {platform.system()}")
        print(f"Python: {sys.version}")
        print(f"Architecture: {platform.machine()}")
        
        # Basic Python tests
        self.run_test("Python syntax check", "python -m py_compile **/*.py")
        self.run_test("Python unit tests", "python -m pytest tests/ -v")
        
        # Node.js tests
        self.run_test("Node.js tests", "npm test")
        self.run_test("ESLint check", "npm run lint")
        
        # CLI tests
        self.run_test("CLI help", "python -m mypackage --help")
        self.run_test("CLI version", "python -m mypackage --version")
        
        # Platform-specific tests
        if platform.system() == "Windows":
            self.run_test("Windows path test", "python tests/test_windows_paths.py")
        else:
            self.run_test("Unix permissions test", "python tests/test_unix_permissions.py")
        
        # Report results
        self.print_summary()
    
    def print_summary(self):
        """Print test summary."""
        print("\n" + "=" * 50)
        print("TEST SUMMARY")
        print("=" * 50)
        
        passed = sum(1 for r in self.results if r['success'])
        total = len(self.results)
        
        for result in self.results:
            status = "✓" if result['success'] else "✗"
            print(f"{status} {result['name']}")
        
        print(f"\nPassed: {passed}/{total}")
        
        if passed < total:
            sys.exit(1)

if __name__ == "__main__":
    matrix = TestMatrix()
    matrix.run_all_tests()
```

## Best Practices Summary

1. **Always use Path objects** instead of string concatenation for file paths
2. **Test on all target platforms** using CI/CD
3. **Handle encoding explicitly** - never assume UTF-8
4. **Check terminal capabilities** before using colors or special characters
5. **Use standard library functions** that handle platform differences
6. **Provide platform-specific installers** when necessary
7. **Document platform-specific requirements** clearly
8. **Test with different shells** not just the default
9. **Handle line endings** appropriately in text files
10. **Use virtual environments** for consistent testing

## Resources and References

- [Python pathlib documentation](https://docs.python.org/3/library/pathlib.html)
- [Node.js path module](https://nodejs.org/api/path.html)
- [GitHub Actions multi-platform testing](https://docs.github.com/en/actions/using-jobs/using-a-matrix-for-your-jobs)
- [Windows Terminal sequences](https://docs.microsoft.com/en-us/windows/console/console-virtual-terminal-sequences)
- [XDG Base Directory Specification](https://specifications.freedesktop.org/basedir-spec/basedir-spec-latest.html)
- [POSIX.1-2017 Standard](https://pubs.opengroup.org/onlinepubs/9699919799/)