# Python CLI Tool Packaging Standards and Best Practices

## Table of Contents
1. [Modern Python Packaging Standards](#modern-python-packaging-standards)
2. [PyPI Publishing Workflows](#pypi-publishing-workflows)
3. [Python CLI Framework Comparison](#python-cli-framework-comparison)
4. [Cross-Platform Considerations](#cross-platform-considerations)
5. [Security Best Practices](#security-best-practices)
6. [Version Management Strategies](#version-management-strategies)
7. [Real-World Examples](#real-world-examples)
8. [Common Pitfalls and Solutions](#common-pitfalls-and-solutions)

## Modern Python Packaging Standards

### PEP 517 - A build-system independent format for source trees

PEP 517 defines a standard API for Python build systems, separating the build process from the installation tool.

**Key Concepts:**
- Build backends (e.g., setuptools, flit, poetry-core, hatchling)
- Build frontends (e.g., pip, build)
- pyproject.toml as the configuration file

**Implementation Example:**
```toml
[build-system]
requires = ["setuptools>=61.0", "wheel"]
build-backend = "setuptools.build_meta"
```

**Benefits:**
- Decouples build tools from installation tools
- Enables alternative build systems
- Consistent interface for building packages

### PEP 518 - Specifying Minimum Build System Requirements

PEP 518 introduces pyproject.toml and the [build-system] table to specify build dependencies.

**Structure:**
```toml
[build-system]
requires = [
    "setuptools>=61.0",
    "wheel",
    "setuptools-scm[toml]>=6.2"
]
build-backend = "setuptools.build_meta"
```

**Key Features:**
- Isolated build environments
- Declarative build dependencies
- Reproducible builds

### PEP 621 - Storing project metadata in pyproject.toml

PEP 621 standardizes how project metadata is stored in pyproject.toml.

**Complete Example:**
```toml
[project]
name = "my-cli-tool"
version = "1.0.0"
description = "A powerful CLI tool"
readme = "README.md"
requires-python = ">=3.8"
license = {text = "MIT"}
authors = [
    {name = "Your Name", email = "you@example.com"}
]
keywords = ["cli", "tool", "automation"]
classifiers = [
    "Development Status :: 5 - Production/Stable",
    "Intended Audience :: Developers",
    "License :: OSI Approved :: MIT License",
    "Programming Language :: Python :: 3",
    "Programming Language :: Python :: 3.8",
    "Programming Language :: Python :: 3.9",
    "Programming Language :: Python :: 3.10",
    "Programming Language :: Python :: 3.11",
    "Programming Language :: Python :: 3.12",
    "Operating System :: OS Independent",
    "Environment :: Console",
]

dependencies = [
    "click>=8.0",
    "rich>=12.0",
    "requests>=2.28",
]

[project.optional-dependencies]
dev = [
    "pytest>=7.0",
    "black>=22.0",
    "mypy>=1.0",
    "ruff>=0.1.0",
]

[project.urls]
Homepage = "https://github.com/username/my-cli-tool"
Documentation = "https://my-cli-tool.readthedocs.io"
Repository = "https://github.com/username/my-cli-tool.git"
"Bug Tracker" = "https://github.com/username/my-cli-tool/issues"

[project.scripts]
my-cli = "my_cli_tool.main:cli"
```

## PyPI Publishing Workflows

### Manual Publishing Process

1. **Prepare your package:**
```bash
# Ensure you have the latest build tools
pip install --upgrade build twine

# Clean previous builds
rm -rf dist/ build/ *.egg-info
```

2. **Build the distribution:**
```bash
python -m build
```

3. **Check the distribution:**
```bash
twine check dist/*
```

4. **Upload to TestPyPI (optional but recommended):**
```bash
twine upload --repository testpypi dist/*
```

5. **Upload to PyPI:**
```bash
twine upload dist/*
```

### Automated Publishing with GitHub Actions

**Complete GitHub Actions Workflow:**
```yaml
name: Publish to PyPI

on:
  release:
    types: [published]

jobs:
  build-and-publish:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v4
    
    - name: Set up Python
      uses: actions/setup-python@v4
      with:
        python-version: '3.11'
    
    - name: Install dependencies
      run: |
        python -m pip install --upgrade pip
        pip install build twine
    
    - name: Build package
      run: python -m build
    
    - name: Check package
      run: twine check dist/*
    
    - name: Publish to Test PyPI
      if: github.event_name == 'push' && startsWith(github.ref, 'refs/tags/v')
      uses: pypa/gh-action-pypi-publish@release/v1
      with:
        password: ${{ secrets.TEST_PYPI_API_TOKEN }}
        repository-url: https://test.pypi.org/legacy/
    
    - name: Publish to PyPI
      if: github.event_name == 'release' && github.event.action == 'published'
      uses: pypa/gh-action-pypi-publish@release/v1
      with:
        password: ${{ secrets.PYPI_API_TOKEN }}
```

### Using Poetry for Publishing

```bash
# Configure PyPI token
poetry config pypi-token.pypi <your-token>

# Build and publish
poetry publish --build

# Or separately
poetry build
poetry publish
```

## Python CLI Framework Comparison

### 1. argparse (Standard Library)

**Pros:**
- No external dependencies
- Part of standard library
- Full control over parsing

**Cons:**
- Verbose for complex CLIs
- No automatic help formatting
- Manual type conversion

**Example:**
```python
import argparse

def main():
    parser = argparse.ArgumentParser(description='My CLI Tool')
    parser.add_argument('command', choices=['start', 'stop', 'status'])
    parser.add_argument('--verbose', '-v', action='store_true')
    parser.add_argument('--port', type=int, default=8080)
    
    args = parser.parse_args()
    
    if args.command == 'start':
        print(f"Starting on port {args.port}")
    elif args.command == 'stop':
        print("Stopping...")
    elif args.command == 'status':
        print("Status: Running" if args.verbose else "Running")

if __name__ == '__main__':
    main()
```

### 2. Click

**Pros:**
- Decorator-based interface
- Automatic help generation
- Built-in types and validation
- Supports complex command hierarchies
- Testing utilities included

**Cons:**
- External dependency
- Learning curve for decorators

**Example:**
```python
import click

@click.group()
@click.option('--verbose', '-v', is_flag=True, help='Enable verbose output')
@click.pass_context
def cli(ctx, verbose):
    """My CLI Tool - A powerful command-line application"""
    ctx.ensure_object(dict)
    ctx.obj['verbose'] = verbose

@cli.command()
@click.option('--port', default=8080, help='Port to run on')
@click.pass_context
def start(ctx, port):
    """Start the service"""
    if ctx.obj['verbose']:
        click.echo(f"Starting service on port {port} (verbose mode)")
    else:
        click.echo(f"Starting on port {port}")

@cli.command()
@click.pass_context
def stop(ctx):
    """Stop the service"""
    click.echo("Stopping service...")
    if ctx.obj['verbose']:
        click.echo("Service stopped successfully")

@cli.command()
@click.option('--format', type=click.Choice(['json', 'text']), default='text')
@click.pass_context
def status(ctx, format):
    """Check service status"""
    if format == 'json':
        click.echo('{"status": "running", "pid": 12345}')
    else:
        click.echo("Status: Running (PID: 12345)")

if __name__ == '__main__':
    cli()
```

### 3. Typer

**Pros:**
- Uses Python type hints
- Automatic CLI generation
- Built on Click
- Very intuitive API
- Great for rapid development

**Cons:**
- External dependency
- Requires Python 3.6+

**Example:**
```python
import typer
from typing import Optional
from enum import Enum

app = typer.Typer()

class OutputFormat(str, Enum):
    json = "json"
    text = "text"

@app.command()
def start(
    port: int = typer.Option(8080, help="Port to run on"),
    verbose: bool = typer.Option(False, "--verbose", "-v", help="Enable verbose output")
):
    """Start the service"""
    if verbose:
        typer.echo(f"Starting service on port {port} (verbose mode)")
    else:
        typer.echo(f"Starting on port {port}")

@app.command()
def stop(verbose: bool = typer.Option(False, "--verbose", "-v")):
    """Stop the service"""
    typer.echo("Stopping service...")
    if verbose:
        typer.echo("Service stopped successfully")

@app.command()
def status(
    format: OutputFormat = typer.Option(OutputFormat.text, help="Output format")
):
    """Check service status"""
    if format == OutputFormat.json:
        typer.echo('{"status": "running", "pid": 12345}')
    else:
        typer.echo("Status: Running (PID: 12345)")

if __name__ == "__main__":
    app()
```

### 4. Fire

**Pros:**
- Minimal code required
- Automatic CLI from any Python object
- Great for quick scripts

**Cons:**
- Less control over interface
- Limited help customization
- Not ideal for complex CLIs

**Example:**
```python
import fire

class MyCLI:
    def __init__(self, verbose=False):
        self.verbose = verbose
    
    def start(self, port=8080):
        """Start the service"""
        if self.verbose:
            print(f"Starting service on port {port} (verbose mode)")
        else:
            print(f"Starting on port {port}")
    
    def stop(self):
        """Stop the service"""
        print("Stopping service...")
        if self.verbose:
            print("Service stopped successfully")
    
    def status(self, format='text'):
        """Check service status"""
        if format == 'json':
            print('{"status": "running", "pid": 12345}')
        else:
            print("Status: Running (PID: 12345)")

if __name__ == '__main__':
    fire.Fire(MyCLI)
```

### Framework Comparison Matrix

| Feature | argparse | Click | Typer | Fire |
|---------|----------|-------|-------|------|
| No dependencies | ✓ | ✗ | ✗ | ✗ |
| Type hints support | ✗ | ✗ | ✓ | ✓ |
| Decorator-based | ✗ | ✓ | ✓ | ✗ |
| Auto-help generation | Basic | ✓ | ✓ | Basic |
| Subcommands | ✓ | ✓ | ✓ | ✓ |
| Testing utilities | ✗ | ✓ | ✓ | ✗ |
| Learning curve | Medium | Medium | Low | Very Low |
| Complex CLI support | ✓ | ✓ | ✓ | Limited |
| Auto-completion | ✗ | ✓ | ✓ | ✗ |

## Cross-Platform Considerations

### 1. Path Handling

```python
from pathlib import Path
import os

# Bad - platform-specific
config_path = "/home/user/.config/myapp/config.json"

# Good - cross-platform
config_path = Path.home() / ".config" / "myapp" / "config.json"

# Better - follows platform conventions
if os.name == 'nt':  # Windows
    config_dir = Path(os.environ.get('APPDATA', Path.home())) / "MyApp"
else:  # Unix-like
    config_dir = Path.home() / ".config" / "myapp"

config_path = config_dir / "config.json"
```

### 2. Console Output

```python
import sys
import os
from rich.console import Console

# Create console with proper encoding
console = Console()

# Handle different terminal capabilities
if os.name == 'nt' and sys.stdin.isatty():
    # Enable ANSI escape sequences on Windows
    os.system("")

# Use rich for consistent cross-platform output
console.print("[bold green]Success![/bold green] Operation completed.")
```

### 3. Shell Commands

```python
import subprocess
import shutil
import sys

def run_command(cmd):
    """Run command in a cross-platform way"""
    if isinstance(cmd, str):
        # Use shell=True carefully
        shell = sys.platform == "win32"
        result = subprocess.run(cmd, shell=shell, capture_output=True, text=True)
    else:
        # Preferred: pass command as list
        result = subprocess.run(cmd, capture_output=True, text=True)
    
    return result

# Finding executables
python_exe = sys.executable  # Always use this for Python
git_exe = shutil.which("git")  # Cross-platform executable finder
```

### 4. File Permissions

```python
import os
import stat
from pathlib import Path

def make_executable(file_path):
    """Make a file executable in a cross-platform way"""
    path = Path(file_path)
    
    if os.name == 'posix':
        # Unix-like systems
        current_permissions = path.stat().st_mode
        path.chmod(current_permissions | stat.S_IXUSR | stat.S_IXGRP | stat.S_IXOTH)
    # Windows doesn't need special permissions for executables
```

## Security Best Practices

### 1. Dependency Scanning

```toml
# pyproject.toml
[project.optional-dependencies]
security = [
    "safety",
    "bandit[toml]",
    "pip-audit",
]
```

**Security Scanning Commands:**
```bash
# Check for known vulnerabilities
safety check
pip-audit

# Static security analysis
bandit -r src/

# Check dependencies for licenses
pip-licenses
```

### 2. Input Validation

```python
import click
import re
from pathlib import Path

def validate_path(ctx, param, value):
    """Validate path input to prevent directory traversal"""
    if value is None:
        return None
    
    path = Path(value).resolve()
    
    # Prevent directory traversal
    if ".." in str(value):
        raise click.BadParameter("Path cannot contain '..'")
    
    # Ensure path is within allowed directory
    allowed_dir = Path.cwd()
    try:
        path.relative_to(allowed_dir)
    except ValueError:
        raise click.BadParameter(f"Path must be within {allowed_dir}")
    
    return path

@click.command()
@click.option('--file', callback=validate_path, help='File to process')
def process_file(file):
    """Safely process a file"""
    if file:
        click.echo(f"Processing {file}")
```

### 3. Secure Configuration

```python
import os
from pathlib import Path
import json
import stat

class SecureConfig:
    def __init__(self, app_name):
        self.app_name = app_name
        self.config_dir = self._get_config_dir()
        self.config_file = self.config_dir / "config.json"
        self._ensure_secure_directory()
    
    def _get_config_dir(self):
        """Get platform-appropriate config directory"""
        if os.name == 'nt':
            base = Path(os.environ.get('APPDATA', Path.home()))
        else:
            base = Path.home() / ".config"
        
        return base / self.app_name
    
    def _ensure_secure_directory(self):
        """Create config directory with secure permissions"""
        self.config_dir.mkdir(parents=True, exist_ok=True)
        
        if os.name == 'posix':
            # Set directory permissions to 700 (owner only)
            self.config_dir.chmod(stat.S_IRWXU)
    
    def save_config(self, config_data):
        """Save configuration securely"""
        self.config_file.write_text(json.dumps(config_data, indent=2))
        
        if os.name == 'posix':
            # Set file permissions to 600 (owner read/write only)
            self.config_file.chmod(stat.S_IRUSR | stat.S_IWUSR)
```

### 4. Environment Variable Handling

```python
import os
from typing import Optional

def get_api_key(key_name: str, required: bool = True) -> Optional[str]:
    """Securely get API key from environment"""
    key = os.environ.get(key_name)
    
    if required and not key:
        raise ValueError(f"{key_name} environment variable is required")
    
    if key and key.strip() != key:
        # Warn about whitespace in keys
        print(f"Warning: {key_name} contains whitespace")
    
    return key

# Never hardcode sensitive data
# Bad:
API_KEY = "sk-1234567890abcdef"

# Good:
API_KEY = get_api_key("MY_APP_API_KEY")
```

## Version Management Strategies

### 1. Semantic Versioning (SemVer)

```python
# src/my_cli_tool/__init__.py
__version__ = "1.2.3"

# Version format: MAJOR.MINOR.PATCH
# MAJOR: Breaking API changes
# MINOR: New features, backwards compatible
# PATCH: Bug fixes, backwards compatible
```

### 2. Single Source of Truth

**Using setuptools_scm:**
```toml
[build-system]
requires = ["setuptools>=61.0", "setuptools_scm[toml]>=6.2"]
build-backend = "setuptools.build_meta"

[tool.setuptools_scm]
write_to = "src/my_cli_tool/_version.py"
```

**Manual Version Management:**
```python
# src/my_cli_tool/_version.py
__version__ = "1.2.3"

# src/my_cli_tool/__init__.py
from ._version import __version__

# pyproject.toml - dynamic version
[project]
name = "my-cli-tool"
dynamic = ["version"]

[tool.setuptools.dynamic]
version = {attr = "my_cli_tool.__version__"}
```

### 3. Version Display in CLI

```python
import click
from my_cli_tool import __version__

@click.command()
@click.version_option(version=__version__, prog_name="my-cli-tool")
def cli():
    """My CLI Tool - A powerful command-line application"""
    pass

# Or with Typer
import typer
from my_cli_tool import __version__

def version_callback(value: bool):
    if value:
        typer.echo(f"my-cli-tool version {__version__}")
        raise typer.Exit()

app = typer.Typer()

@app.callback()
def main(
    version: bool = typer.Option(
        None, "--version", callback=version_callback, is_eager=True
    )
):
    """My CLI Tool - A powerful command-line application"""
    pass
```

### 4. Automated Version Bumping

```yaml
# .github/workflows/bump-version.yml
name: Bump version

on:
  push:
    branches: [main]

jobs:
  bump-version:
    if: "!contains(github.event.head_commit.message, '[skip ci]')"
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v4
      with:
        fetch-depth: 0
        token: ${{ secrets.GITHUB_TOKEN }}
    
    - name: Bump version and push tag
      uses: anothrNick/github-tag-action@1.64.0
      env:
        GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        WITH_V: true
        DEFAULT_BUMP: patch
```

## Real-World Examples

### 1. Poetry - Modern Dependency Management

**Key Features:**
- Uses pyproject.toml exclusively
- Integrated dependency resolution
- Built-in virtual environment management
- Publishing commands included

**Structure:**
```
poetry/
├── pyproject.toml
├── poetry/
│   ├── __init__.py
│   ├── __main__.py
│   ├── console/
│   │   ├── application.py
│   │   └── commands/
│   └── core/
└── tests/
```

### 2. Black - The Uncompromising Code Formatter

**Key Features:**
- Click-based CLI
- Extensive configuration options
- Plugin system
- Excellent error handling

**CLI Pattern:**
```python
# Simplified version of Black's CLI structure
import click
from pathlib import Path

@click.command(context_settings=dict(help_option_names=["-h", "--help"]))
@click.option("-l", "--line-length", type=int, default=88)
@click.option("-t", "--target-version", multiple=True)
@click.option("--check", is_flag=True)
@click.option("--diff", is_flag=True)
@click.argument(
    "src",
    nargs=-1,
    type=click.Path(exists=True, file_okay=True, dir_okay=True, readable=True),
    required=True,
)
@click.pass_context
def main(ctx, line_length, target_version, check, diff, src):
    """The uncompromising code formatter."""
    # Implementation
    pass
```

### 3. HTTPie - Modern HTTP CLI Client

**Key Features:**
- Intuitive syntax
- JSON support
- Formatted output
- Plugin system

**Architecture Insights:**
- Uses argparse for maximum control
- Custom argument parsing for HTTP syntax
- Extensive output formatting system

### 4. AWS CLI - Enterprise-Grade CLI

**Key Features:**
- Generated from API definitions
- Extensive plugin system
- Multiple output formats
- Pagination support

**Patterns:**
```python
# Service-based command structure
aws <service> <operation> [parameters]

# Consistent parameter handling
--output {json,yaml,text,table}
--query <jmespath-query>
--profile <profile-name>
```

### 5. Pytest - Testing Framework

**Key Features:**
- Plugin architecture
- Fixture system
- Assertion rewriting
- Multiple test discovery methods

**CLI Design:**
- Extensive use of plugins
- Configuration through multiple sources
- Excellent error reporting

## Common Pitfalls and Solutions

### 1. Import Issues

**Problem:** Package imports fail when installed
```python
# Bad - relative imports in scripts
from src.mymodule import function

# Good - absolute imports
from my_cli_tool.mymodule import function
```

**Solution:** Proper package structure
```
my-cli-tool/
├── pyproject.toml
├── src/
│   └── my_cli_tool/
│       ├── __init__.py
│       ├── __main__.py  # Entry point
│       └── cli.py
└── tests/
```

### 2. Entry Point Issues

**Problem:** CLI command not found after installation

**Solution:** Correct entry point configuration
```toml
[project.scripts]
my-cli = "my_cli_tool.cli:main"

# Or for setuptools
[options.entry_points]
console_scripts =
    my-cli = my_cli_tool.cli:main
```

### 3. Dependency Conflicts

**Problem:** Incompatible dependency versions

**Solution:** Use dependency constraints
```toml
[project]
dependencies = [
    "click>=8.0,<9.0",
    "requests>=2.28,<3.0",
    "rich>=12.0,<14.0",
]

# Create constraints file
# requirements-constraints.txt
click==8.1.7
requests==2.31.0
rich==13.7.0
```

### 4. Platform-Specific Issues

**Problem:** Code works on one platform but not another

**Solution:** Platform-specific dependencies
```toml
[project]
dependencies = [
    "click>=8.0",
    'colorama>=0.4; platform_system == "Windows"',
    'pyreadline3>=3.4; platform_system == "Windows"',
]
```

### 5. Testing CLI Applications

**Problem:** Difficult to test CLI interactions

**Solution:** Use Click's testing utilities
```python
from click.testing import CliRunner
from my_cli_tool.cli import cli

def test_cli_command():
    runner = CliRunner()
    result = runner.invoke(cli, ['--help'])
    assert result.exit_code == 0
    assert 'Usage:' in result.output
    
    # Test with input
    result = runner.invoke(cli, ['start', '--port', '9000'])
    assert result.exit_code == 0
    assert '9000' in result.output
```

### 6. Configuration File Locations

**Problem:** Config files in wrong locations

**Solution:** Use platformdirs
```python
from platformdirs import user_config_dir, user_data_dir, user_cache_dir

app_name = "my-cli-tool"
config_dir = Path(user_config_dir(app_name))
data_dir = Path(user_data_dir(app_name))
cache_dir = Path(user_cache_dir(app_name))
```

## Best Practices Summary

1. **Always use pyproject.toml** for modern Python projects
2. **Choose the right CLI framework** based on your needs
3. **Test on all target platforms** (Windows, macOS, Linux)
4. **Implement proper security measures** from the start
5. **Follow semantic versioning** strictly
6. **Automate publishing** with CI/CD
7. **Write comprehensive tests** including CLI tests
8. **Document everything** - usage, installation, development
9. **Handle errors gracefully** with helpful messages
10. **Use type hints** for better IDE support and clarity

## Additional Resources

- [Python Packaging User Guide](https://packaging.python.org/)
- [PyPA Build](https://pypa-build.readthedocs.io/)
- [Click Documentation](https://click.palletsprojects.com/)
- [Typer Documentation](https://typer.tiangolo.com/)
- [Poetry Documentation](https://python-poetry.org/)
- [Real Python - Python CLI Tutorial](https://realpython.com/python-command-line-interfaces/)
- [PEP Index](https://peps.python.org/)