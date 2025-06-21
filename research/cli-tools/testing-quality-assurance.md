# CLI Tools Testing and Quality Assurance Guide

## Table of Contents
1. [Introduction](#introduction)
2. [Testing Framework Comparisons](#testing-framework-comparisons)
3. [Unit Testing Strategies](#unit-testing-strategies)
4. [Integration Testing](#integration-testing)
5. [Cross-Platform Testing](#cross-platform-testing)
6. [Performance Testing](#performance-testing)
7. [Mock Strategies](#mock-strategies)
8. [CLI Command Testing Patterns](#cli-command-testing-patterns)
9. [Test Matrix Strategies](#test-matrix-strategies)
10. [Continuous Testing](#continuous-testing)
11. [Real-World Examples](#real-world-examples)

## Introduction

Testing CLI applications presents unique challenges compared to traditional web or API testing. This guide provides comprehensive strategies for ensuring quality in CLI tools across different languages and platforms.

### Key Testing Principles for CLIs
- **Exit codes matter**: Test both successful (0) and error (non-zero) exit codes
- **Output validation**: Verify stdout, stderr, and formatting
- **Argument parsing**: Test various argument combinations and edge cases
- **Cross-platform compatibility**: Ensure consistent behavior across OS
- **Performance**: CLIs should be fast and responsive
- **User experience**: Test help text, error messages, and interactive prompts

## Testing Framework Comparisons

### Python CLI Testing Frameworks

#### pytest + click.testing
```python
# Best for: Click-based CLIs
# Pros: Built-in CLI runner, isolated filesystem
# Cons: Click-specific

from click.testing import CliRunner
import pytest

def test_cli_command():
    runner = CliRunner()
    result = runner.invoke(cli, ['--help'])
    assert result.exit_code == 0
    assert 'Usage:' in result.output
```

#### pytest + typer.testing
```python
# Best for: Typer-based CLIs
# Pros: Modern, type-safe testing
# Cons: Requires Typer framework

from typer.testing import CliRunner
import pytest

runner = CliRunner()

def test_app():
    result = runner.invoke(app, ["--name", "World"])
    assert result.exit_code == 0
    assert "Hello World" in result.output
```

#### pytest + subprocess
```python
# Best for: Framework-agnostic testing
# Pros: Tests actual CLI behavior
# Cons: Slower, requires installation

import subprocess
import pytest

def test_cli_subprocess():
    result = subprocess.run(
        ['python', '-m', 'mycli', '--version'],
        capture_output=True,
        text=True
    )
    assert result.returncode == 0
    assert 'version' in result.stdout
```

### Node.js CLI Testing Frameworks

#### Jest
```javascript
// Best for: Modern JS/TS projects
// Pros: Fast, great mocking, snapshot testing
// Cons: Large dependency

const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

describe('CLI', () => {
  test('should display version', async () => {
    const { stdout } = await execAsync('node cli.js --version');
    expect(stdout).toMatch(/\d+\.\d+\.\d+/);
  });
});
```

#### Mocha + Chai
```javascript
// Best for: Flexible testing needs
// Pros: Lightweight, many assertion styles
// Cons: Requires multiple packages

const { expect } = require('chai');
const { spawn } = require('child_process');

describe('CLI Tests', function() {
  it('should return help text', function(done) {
    const cli = spawn('node', ['cli.js', '--help']);
    let output = '';
    
    cli.stdout.on('data', (data) => {
      output += data.toString();
    });
    
    cli.on('close', (code) => {
      expect(code).to.equal(0);
      expect(output).to.include('Usage:');
      done();
    });
  });
});
```

#### Ava
```javascript
// Best for: Concurrent testing
// Pros: Fast parallel execution, minimal API
// Cons: Less ecosystem support

import test from 'ava';
import execa from 'execa';

test('cli shows help', async t => {
  const {stdout} = await execa('node', ['cli.js', '--help']);
  t.regex(stdout, /Usage:/);
});
```

### Framework Comparison Matrix

| Feature | pytest | Jest | Mocha | Ava |
|---------|--------|------|-------|-----|
| Speed | ★★★☆☆ | ★★★★☆ | ★★★☆☆ | ★★★★★ |
| Ease of use | ★★★★★ | ★★★★☆ | ★★★☆☆ | ★★★★☆ |
| Mocking | ★★★★☆ | ★★★★★ | ★★★☆☆ | ★★★☆☆ |
| Parallel execution | ★★★☆☆ | ★★★★☆ | ★★☆☆☆ | ★★★★★ |
| Snapshot testing | ★★☆☆☆ | ★★★★★ | ★☆☆☆☆ | ★★★☆☆ |
| CLI-specific features | ★★★★★ | ★★★☆☆ | ★★★☆☆ | ★★★☆☆ |

## Unit Testing Strategies

### 1. Command Parsing Tests
```python
# Python example with pytest
def test_argument_parsing():
    """Test that arguments are correctly parsed"""
    parser = create_parser()
    args = parser.parse_args(['--output', 'json', '--verbose'])
    assert args.output == 'json'
    assert args.verbose is True

def test_invalid_arguments():
    """Test error handling for invalid arguments"""
    parser = create_parser()
    with pytest.raises(SystemExit):
        parser.parse_args(['--invalid-option'])
```

```javascript
// Node.js example with Jest
describe('Argument Parser', () => {
  test('parses long options', () => {
    const args = parseArgs(['--output', 'json', '--verbose']);
    expect(args.output).toBe('json');
    expect(args.verbose).toBe(true);
  });

  test('parses short options', () => {
    const args = parseArgs(['-o', 'json', '-v']);
    expect(args.output).toBe('json');
    expect(args.verbose).toBe(true);
  });
});
```

### 2. Command Handler Tests
```python
# Test individual command handlers in isolation
def test_list_command(mock_data):
    """Test list command with mocked data"""
    result = list_command(mock_data)
    assert len(result) == 3
    assert all('name' in item for item in result)

@pytest.mark.parametrize("format_type,expected", [
    ("json", '{"items": ['),
    ("csv", 'name,value'),
    ("table", '┌─'),
])
def test_output_formatting(data, format_type, expected):
    """Test different output formats"""
    output = format_output(data, format_type)
    assert output.startswith(expected)
```

### 3. Error Handling Tests
```javascript
// Test error scenarios
describe('Error Handling', () => {
  test('handles missing required arguments', async () => {
    const result = await runCLI([]);
    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain('Missing required argument');
  });

  test('handles file not found', async () => {
    const result = await runCLI(['process', 'nonexistent.txt']);
    expect(result.exitCode).toBe(2);
    expect(result.stderr).toContain('File not found');
  });
});
```

## Integration Testing

### 1. Full Command Flow Tests
```python
# Test complete command execution
def test_end_to_end_workflow():
    """Test a complete workflow"""
    runner = CliRunner()
    
    # Create a project
    result = runner.invoke(cli, ['create', 'myproject'])
    assert result.exit_code == 0
    
    # List projects
    result = runner.invoke(cli, ['list'])
    assert 'myproject' in result.output
    
    # Delete project
    result = runner.invoke(cli, ['delete', 'myproject', '--force'])
    assert result.exit_code == 0
```

### 2. Configuration Testing
```javascript
// Test configuration file handling
describe('Configuration', () => {
  test('loads config from file', async () => {
    const configPath = path.join(tmpDir, '.clirc');
    await fs.writeFile(configPath, JSON.stringify({
      output: 'json',
      color: false
    }));
    
    const result = await runCLI(['status'], { cwd: tmpDir });
    expect(result.stdout).toMatch(/^\{/); // JSON output
  });

  test('CLI args override config file', async () => {
    const result = await runCLI(['status', '--output', 'table']);
    expect(result.stdout).toContain('│'); // Table output
  });
});
```

### 3. Plugin/Extension Testing
```python
# Test plugin system
def test_plugin_loading():
    """Test that plugins are correctly loaded"""
    runner = CliRunner()
    
    # Install test plugin
    plugin_dir = runner.isolated_filesystem()
    create_test_plugin(plugin_dir)
    
    result = runner.invoke(cli, ['--plugin-dir', plugin_dir, 'custom-command'])
    assert result.exit_code == 0
    assert 'Plugin executed' in result.output
```

## Cross-Platform Testing

### 1. Platform-Specific Test Decorators
```python
# Python cross-platform testing
import sys
import pytest

@pytest.mark.skipif(sys.platform == "win32", reason="Unix only")
def test_unix_permissions():
    """Test Unix-specific file permissions"""
    result = runner.invoke(cli, ['chmod', '+x', 'script.sh'])
    assert result.exit_code == 0

@pytest.mark.skipif(sys.platform != "win32", reason="Windows only")
def test_windows_paths():
    """Test Windows path handling"""
    result = runner.invoke(cli, ['process', 'C:\\Users\\test\\file.txt'])
    assert result.exit_code == 0
```

### 2. Path Handling Tests
```javascript
// Node.js cross-platform path testing
const path = require('path');

describe('Path Handling', () => {
  test('handles platform-specific paths', () => {
    const inputPath = process.platform === 'win32' 
      ? 'C:\\Users\\test\\file.txt'
      : '/home/test/file.txt';
    
    const normalized = normalizePath(inputPath);
    expect(normalized).toBe(path.normalize(inputPath));
  });

  test('handles UNC paths on Windows', () => {
    if (process.platform === 'win32') {
      const uncPath = '\\\\server\\share\\file.txt';
      const result = processPath(uncPath);
      expect(result).toBeDefined();
    }
  });
});
```

### 3. Environment-Specific Testing
```python
# Test environment variables across platforms
@pytest.mark.parametrize("platform,env_var,expected", [
    ("linux", "HOME", "/home/user"),
    ("darwin", "HOME", "/Users/user"),
    ("win32", "USERPROFILE", "C:\\Users\\user"),
])
def test_home_directory(monkeypatch, platform, env_var, expected):
    """Test home directory detection across platforms"""
    monkeypatch.setattr(sys, "platform", platform)
    monkeypatch.setenv(env_var, expected)
    
    home = get_home_directory()
    assert home == expected
```

## Performance Testing

### 1. Benchmark Tests
```python
# Python performance benchmarks
import pytest
import time

@pytest.mark.benchmark
def test_large_file_processing(benchmark):
    """Benchmark file processing performance"""
    def process_file():
        return runner.invoke(cli, ['process', 'large_file.json'])
    
    result = benchmark(process_file)
    assert result.exit_code == 0
    assert benchmark.stats['mean'] < 1.0  # Should complete in < 1 second

def test_startup_time():
    """Test CLI startup performance"""
    start = time.time()
    result = subprocess.run(['mycli', '--version'], capture_output=True)
    duration = time.time() - start
    
    assert duration < 0.1  # Should start in < 100ms
    assert result.returncode == 0
```

### 2. Memory Usage Tests
```javascript
// Node.js memory usage testing
describe('Memory Usage', () => {
  test('handles large datasets efficiently', async () => {
    const initialMemory = process.memoryUsage().heapUsed;
    
    // Process large file
    await runCLI(['process', 'large-dataset.json']);
    
    // Force garbage collection if available
    if (global.gc) global.gc();
    
    const finalMemory = process.memoryUsage().heapUsed;
    const memoryIncrease = (finalMemory - initialMemory) / 1024 / 1024;
    
    expect(memoryIncrease).toBeLessThan(50); // Less than 50MB increase
  });
});
```

### 3. Load Testing
```python
# Concurrent execution testing
import asyncio
import pytest

@pytest.mark.asyncio
async def test_concurrent_execution():
    """Test CLI handles concurrent executions"""
    async def run_command():
        proc = await asyncio.create_subprocess_exec(
            'mycli', 'process', 'data.json',
            stdout=asyncio.subprocess.PIPE
        )
        return await proc.wait()
    
    # Run 10 concurrent processes
    tasks = [run_command() for _ in range(10)]
    results = await asyncio.gather(*tasks)
    
    assert all(code == 0 for code in results)
```

## Mock Strategies

### 1. File System Mocking
```python
# Python filesystem mocking
from unittest.mock import patch, mock_open

def test_file_reading_with_mock():
    """Test file operations with mocked filesystem"""
    mock_data = '{"key": "value"}'
    
    with patch('builtins.open', mock_open(read_data=mock_data)):
        result = runner.invoke(cli, ['read', 'config.json'])
        assert result.exit_code == 0
        assert 'key' in result.output

# Using pytest fixtures for temporary filesystem
@pytest.fixture
def temp_config(tmp_path):
    config_file = tmp_path / "config.json"
    config_file.write_text('{"setting": "value"}')
    return str(config_file)

def test_with_temp_files(temp_config):
    result = runner.invoke(cli, ['load', temp_config])
    assert result.exit_code == 0
```

### 2. Network Mocking
```javascript
// Node.js network mocking with nock
const nock = require('nock');

describe('API Commands', () => {
  beforeEach(() => {
    nock('https://api.example.com')
      .get('/data')
      .reply(200, { status: 'ok', data: [] });
  });

  test('fetches data from API', async () => {
    const result = await runCLI(['fetch', '--source', 'api']);
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('status: ok');
  });

  test('handles API errors gracefully', async () => {
    nock.cleanAll();
    nock('https://api.example.com')
      .get('/data')
      .reply(500, { error: 'Internal Server Error' });

    const result = await runCLI(['fetch', '--source', 'api']);
    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain('API error');
  });
});
```

### 3. Environment Mocking
```python
# Mock environment variables and system calls
import os
from unittest.mock import patch

@patch.dict(os.environ, {'MY_CLI_TOKEN': 'test-token'})
def test_with_env_var():
    """Test with mocked environment variable"""
    result = runner.invoke(cli, ['auth', 'status'])
    assert 'Authenticated' in result.output

@patch('platform.system', return_value='Linux')
@patch('platform.release', return_value='5.4.0')
def test_system_info(mock_release, mock_system):
    """Test system information display"""
    result = runner.invoke(cli, ['system', 'info'])
    assert 'Linux 5.4.0' in result.output
```

## CLI Command Testing Patterns

### 1. Interactive Command Testing
```python
# Test interactive prompts
def test_interactive_confirmation():
    """Test interactive yes/no prompts"""
    runner = CliRunner()
    result = runner.invoke(cli, ['delete', 'important-file'], input='y\n')
    assert result.exit_code == 0
    assert 'File deleted' in result.output

def test_interactive_multi_step():
    """Test multi-step interactive process"""
    inputs = '\n'.join([
        'project-name',
        'python',
        'y',  # Use defaults
        ''    # Confirm
    ])
    result = runner.invoke(cli, ['init'], input=inputs)
    assert result.exit_code == 0
    assert 'Project created' in result.output
```

### 2. Pipe and Redirect Testing
```javascript
// Test CLI with piped input
describe('Pipe Support', () => {
  test('accepts piped input', async () => {
    const input = 'line1\nline2\nline3';
    const result = await runCLI(['count'], { input });
    expect(result.stdout).toContain('3 lines');
  });

  test('supports output piping', async () => {
    const proc1 = spawn('node', ['cli.js', 'list']);
    const proc2 = spawn('grep', ['active']);
    
    proc1.stdout.pipe(proc2.stdin);
    
    const output = await streamToString(proc2.stdout);
    expect(output).toContain('active');
  });
});
```

### 3. Subcommand Testing
```python
# Test nested subcommands
def test_subcommand_structure():
    """Test complex subcommand hierarchies"""
    # Test main command
    result = runner.invoke(cli, ['project'])
    assert result.exit_code == 0
    assert 'Commands:' in result.output
    
    # Test subcommand
    result = runner.invoke(cli, ['project', 'create', 'myapp'])
    assert result.exit_code == 0
    
    # Test sub-subcommand
    result = runner.invoke(cli, ['project', 'config', 'set', 'key', 'value'])
    assert result.exit_code == 0
```

## Test Matrix Strategies

### 1. GitHub Actions Matrix
```yaml
# .github/workflows/test.yml
name: Test

on: [push, pull_request]

jobs:
  test:
    strategy:
      matrix:
        os: [ubuntu-latest, windows-latest, macos-latest]
        python-version: ['3.8', '3.9', '3.10', '3.11']
        node-version: ['14', '16', '18']
      fail-fast: false
    
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
    
    - name: Install dependencies
      run: |
        pip install -e .[test]
        npm install
    
    - name: Run Python tests
      run: pytest -v --cov=mycli
    
    - name: Run Node.js tests
      run: npm test
    
    - name: Test CLI installation
      run: |
        pip install .
        mycli --version
        npm link
        mycli-js --version
```

### 2. Platform-Specific Tests
```yaml
# Platform-specific test jobs
jobs:
  test-unix-specific:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    - name: Test Unix permissions
      run: |
        chmod +x scripts/test-permissions.sh
        ./scripts/test-permissions.sh
    
    - name: Test signal handling
      run: pytest tests/test_unix_signals.py

  test-windows-specific:
    runs-on: windows-latest
    steps:
    - uses: actions/checkout@v3
    - name: Test Windows registry
      run: pytest tests/test_windows_registry.py
    
    - name: Test PowerShell integration
      run: |
        $PSVersionTable
        .\test-powershell-integration.ps1
```

### 3. Dependency Version Matrix
```yaml
# Test with different dependency versions
jobs:
  test-dependencies:
    strategy:
      matrix:
        include:
          - click-version: "7.0"
            pytest-version: "6.0"
          - click-version: "8.0"
            pytest-version: "7.0"
          - click-version: "8.1"
            pytest-version: "7.4"
    
    steps:
    - name: Install specific versions
      run: |
        pip install click==${{ matrix.click-version }}
        pip install pytest==${{ matrix.pytest-version }}
    
    - name: Run compatibility tests
      run: pytest tests/compatibility/
```

## Continuous Testing

### 1. Pre-commit Hooks
```yaml
# .pre-commit-config.yaml
repos:
  - repo: local
    hooks:
      - id: test-cli-commands
        name: Test CLI Commands
        entry: bash -c 'python -m pytest tests/test_cli.py::test_all_commands_have_help -v'
        language: system
        pass_filenames: false
        always_run: true
      
      - id: test-cli-smoke
        name: CLI Smoke Test
        entry: bash -c './scripts/smoke-test.sh'
        language: system
        pass_filenames: false
```

### 2. Automated Release Testing
```javascript
// scripts/release-test.js
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

async function testRelease() {
  console.log('Testing release package...');
  
  // Test npm package
  await execAsync('npm pack');
  await execAsync('npm install -g *.tgz');
  
  // Run smoke tests
  const tests = [
    'mycli --version',
    'mycli --help',
    'mycli list',
    'mycli config show'
  ];
  
  for (const test of tests) {
    console.log(`Running: ${test}`);
    const { stdout, stderr } = await execAsync(test);
    if (stderr) throw new Error(`Test failed: ${test}\n${stderr}`);
    console.log(`✓ ${test}`);
  }
  
  console.log('All release tests passed!');
}

testRelease().catch(console.error);
```

### 3. Nightly Testing
```yaml
# .github/workflows/nightly.yml
name: Nightly Tests

on:
  schedule:
    - cron: '0 2 * * *'  # Run at 2 AM UTC daily

jobs:
  extended-tests:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    
    - name: Run extended test suite
      run: |
        pip install -e .[test,dev]
        pytest tests/ -v --slow --integration
    
    - name: Test against development dependencies
      run: |
        pip install --pre -U click typer rich
        pytest tests/compatibility/
    
    - name: Memory leak detection
      run: |
        pip install memory-profiler
        mprof run python -m mycli process large-dataset.json
        mprof plot -o memory-usage.png
    
    - name: Upload artifacts
      uses: actions/upload-artifact@v3
      with:
        name: nightly-test-results
        path: |
          memory-usage.png
          test-results.xml
```

## Real-World Examples

### 1. HTTPie Test Suite
```python
# Example from HTTPie's test suite
# https://github.com/httpie/httpie

def test_GET(httpbin):
    r = http('GET', httpbin.url + '/get')
    assert HTTP_OK in r

def test_DELETE(httpbin):
    r = http('DELETE', httpbin.url + '/delete')
    assert HTTP_OK in r

def test_POST_JSON_data(httpbin):
    r = http('POST', httpbin.url + '/post', 'hello=world')
    assert HTTP_OK in r
    assert r.json['json'] == {'hello': 'world'}

def test_headers(httpbin):
    r = http('GET', httpbin.url + '/headers', 'Foo:bar')
    assert HTTP_OK in r
    assert r.json['headers']['Foo'] == 'bar'
```

### 2. AWS CLI Test Patterns
```python
# AWS CLI-style testing approach
class TestS3Commands(BaseAWSCommandParamsTest):
    
    def test_list_buckets(self):
        self.assert_params_for_cmd(
            's3api list-buckets',
            expected_params={},
            expected_endpoint='https://s3.amazonaws.com/'
        )
    
    def test_get_object(self):
        self.assert_params_for_cmd(
            's3api get-object --bucket mybucket --key mykey outfile',
            expected_params={'Bucket': 'mybucket', 'Key': 'mykey'},
            expected_endpoint='https://s3.amazonaws.com/'
        )
```

### 3. Docker CLI Test Example
```go
// Docker CLI test pattern (Go)
func TestRunAttach(t *testing.T) {
    cli := test.NewFakeCli(&fakeClient{
        createContainerFunc: func(config *container.Config) (container.ContainerCreateCreatedBody, error) {
            return container.ContainerCreateCreatedBody{ID: "id"}, nil
        },
        waitFunc: func(containerID string) (<-chan container.ContainerWaitOKBody, <-chan error) {
            bodyChan := make(chan container.ContainerWaitOKBody)
            go func() {
                bodyChan <- container.ContainerWaitOKBody{}
            }()
            return bodyChan, make(chan error)
        },
    })
    
    cmd := NewRunCommand(cli)
    cmd.SetArgs([]string{"--detach=false", "alpine"})
    err := cmd.Execute()
    assert.NilError(t, err)
}
```

### 4. npm CLI Test Patterns
```javascript
// npm CLI test example
const t = require('tap')
const { fake: mockNpm } = require('../fixtures/mock-npm')

t.test('npm install', async t => {
  const { npm, outputs } = mockNpm(t, {
    '@npmcli/arborist': {
      Arborist: class {
        async install () {
          return {
            added: 1,
            removed: 0,
            changed: 0,
          }
        }
      },
    },
  })
  
  await npm.exec('install', ['express'])
  t.match(outputs, [
    ['added 1 package'],
  ])
})
```

## Best Practices Summary

### 1. Test Organization
```
tests/
├── unit/
│   ├── test_parser.py
│   ├── test_commands.py
│   └── test_utils.py
├── integration/
│   ├── test_workflows.py
│   └── test_config.py
├── e2e/
│   ├── test_installation.py
│   └── test_real_scenarios.py
├── performance/
│   ├── test_benchmarks.py
│   └── test_memory.py
└── fixtures/
    ├── sample_data.json
    └── mock_responses.py
```

### 2. Test Naming Conventions
- Use descriptive test names: `test_parse_json_with_invalid_syntax_shows_error`
- Group related tests in classes or describe blocks
- Use consistent prefixes: `test_`, `should_`, `when_`

### 3. CI/CD Integration
- Run fast unit tests on every commit
- Run integration tests on pull requests
- Run full test suite including performance tests nightly
- Use test result reporting and coverage tracking

### 4. Test Data Management
```python
# Use fixtures for test data
@pytest.fixture
def sample_config():
    return {
        'version': '1.0',
        'settings': {
            'output': 'json',
            'verbose': True
        }
    }

# Use factories for complex data
def create_test_project(name='test-project', **kwargs):
    defaults = {
        'name': name,
        'version': '0.1.0',
        'dependencies': []
    }
    defaults.update(kwargs)
    return Project(**defaults)
```

### 5. Error Testing Patterns
```javascript
// Test various error conditions
describe('Error Handling', () => {
  const errorCases = [
    {
      args: ['--invalid-flag'],
      expectedError: 'Unknown option',
      exitCode: 1
    },
    {
      args: ['process', 'nonexistent.txt'],
      expectedError: 'File not found',
      exitCode: 2
    },
    {
      args: ['connect', '--timeout', '-1'],
      expectedError: 'Invalid timeout value',
      exitCode: 1
    }
  ];

  errorCases.forEach(({ args, expectedError, exitCode }) => {
    test(`handles ${expectedError}`, async () => {
      const result = await runCLI(args);
      expect(result.exitCode).toBe(exitCode);
      expect(result.stderr).toContain(expectedError);
    });
  });
});
```

## Conclusion

Comprehensive CLI testing requires a multi-layered approach combining unit tests, integration tests, and real-world scenario testing. Key takeaways:

1. **Choose the right tools**: Select testing frameworks that match your language and CLI framework
2. **Test at multiple levels**: Unit, integration, and end-to-end tests each serve important purposes
3. **Automate cross-platform testing**: Use CI/CD matrices to ensure compatibility
4. **Mock external dependencies**: Keep tests fast and reliable
5. **Monitor performance**: CLIs should be fast and responsive
6. **Test the user experience**: Verify help text, error messages, and interactive features

Remember that good CLI testing ultimately leads to better user experiences and more reliable tools.