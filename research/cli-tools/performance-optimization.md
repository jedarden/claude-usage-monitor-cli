# CLI Performance Optimization Guide

## Table of Contents
1. [Introduction](#introduction)
2. [Profiling Tools and Techniques](#profiling-tools-and-techniques)
3. [Startup Time Optimization](#startup-time-optimization)
4. [Lazy Loading and Code Splitting](#lazy-loading-and-code-splitting)
5. [Binary Compilation Options](#binary-compilation-options)
6. [Caching Strategies](#caching-strategies)
7. [Memory Usage Optimization](#memory-usage-optimization)
8. [Network Request Optimization](#network-request-optimization)
9. [Case Studies: Fast CLIs](#case-studies-fast-clis)
10. [Concrete Optimization Examples](#concrete-optimization-examples)

## Introduction

CLI performance is critical for developer experience. Users expect instant feedback, especially for frequently-used commands. This guide covers proven techniques to optimize CLI tools for speed and efficiency.

### Performance Goals
- **Startup time**: < 100ms for simple commands
- **First meaningful output**: < 200ms
- **Memory usage**: < 50MB for typical operations
- **Binary size**: < 10MB compressed

## Profiling Tools and Techniques

### Python Profiling

```python
# Using cProfile
import cProfile
import pstats

def profile_cli():
    profiler = cProfile.Profile()
    profiler.enable()
    
    # Your CLI code here
    main()
    
    profiler.disable()
    stats = pstats.Stats(profiler)
    stats.sort_stats('cumulative')
    stats.print_stats(20)

# Using py-spy for production profiling
# $ py-spy record -o profile.svg -- python your_cli.py
```

### Node.js Profiling

```javascript
// Using built-in profiler
// $ node --prof your-cli.js
// $ node --prof-process isolate-*.log

// Using clinic.js
// $ clinic doctor -- node your-cli.js

// Manual timing
const start = process.hrtime.bigint();
// ... code ...
const end = process.hrtime.bigint();
console.log(`Execution time: ${(end - start) / 1000000n}ms`);
```

### Startup Time Measurement

```bash
# Simple timing
time your-cli --version

# Detailed breakdown with hyperfine
hyperfine --warmup 3 'your-cli --version' 'other-cli --version'

# Cold vs warm startup
hyperfine --prepare 'sync; echo 3 > /proc/sys/vm/drop_caches' 'your-cli'
```

## Startup Time Optimization

### 1. Minimize Import Time

**Python - Before (150ms startup):**
```python
# cli.py
import pandas as pd
import numpy as np
import requests
from rich.console import Console
from rich.table import Table

def main():
    print("Hello World")
```

**Python - After (30ms startup):**
```python
# cli.py
def main():
    # Lazy imports
    if needs_data_processing():
        import pandas as pd
        import numpy as np
    
    if needs_networking():
        import requests
    
    print("Hello World")
```

### 2. Optimize Module Loading

**Node.js - Before (200ms startup):**
```javascript
const axios = require('axios');
const chalk = require('chalk');
const ora = require('ora');
const { table } = require('table');

module.exports = function cli() {
    console.log('Hello World');
};
```

**Node.js - After (50ms startup):**
```javascript
// Lazy loading with dynamic imports
module.exports = async function cli() {
    console.log('Hello World');
    
    if (needsNetworking) {
        const axios = await import('axios');
    }
    
    if (needsFormatting) {
        const chalk = await import('chalk');
    }
};
```

### 3. Precompile Regular Expressions

```python
# Compile regex at module level, not in functions
import re

# Bad - compiles on every call
def validate_input(text):
    if re.match(r'^[a-zA-Z0-9]+$', text):
        return True

# Good - compiles once
VALID_INPUT = re.compile(r'^[a-zA-Z0-9]+$')

def validate_input(text):
    if VALID_INPUT.match(text):
        return True
```

## Lazy Loading and Code Splitting

### Python Lazy Loading Pattern

```python
class LazyLoader:
    def __init__(self, module_name):
        self.module_name = module_name
        self._module = None
    
    def __getattr__(self, attr):
        if self._module is None:
            self._module = __import__(self.module_name)
        return getattr(self._module, attr)

# Usage
heavy_module = LazyLoader('numpy')

def process_data():
    # numpy is only imported when actually used
    return heavy_module.array([1, 2, 3])
```

### Node.js Code Splitting

```javascript
// commands/index.js
const commands = {
    async analyze() {
        const { analyze } = await import('./analyze.js');
        return analyze;
    },
    async report() {
        const { report } = await import('./report.js');
        return report;
    }
};

// Only load the command that's actually used
const command = await commands[userCommand]();
```

## Binary Compilation Options

### 1. Python - Nuitka

```bash
# Install Nuitka
pip install nuitka

# Compile with optimizations
nuitka3 --standalone --onefile \
    --enable-plugin=anti-bloat \
    --remove-output \
    --assume-yes-for-downloads \
    your_cli.py

# Results:
# - Startup time: 10-50ms (vs 100-200ms)
# - Binary size: 15-30MB
# - Memory usage: Similar to Python
```

### 2. Node.js - pkg

```bash
# Install pkg
npm install -g pkg

# Package configuration
{
  "pkg": {
    "scripts": ["lib/**/*.js"],
    "assets": ["assets/**/*"],
    "targets": ["node16-linux-x64", "node16-macos-x64", "node16-win-x64"]
  }
}

# Build
pkg . --compress GZip

# Results:
# - Startup time: 20-40ms (vs 150ms)
# - Binary size: 30-50MB
# - Memory usage: ~40MB
```

### 3. Go - Native Compilation

```go
// Fast by default
package main

import "fmt"

func main() {
    fmt.Println("Hello World")
}

// Build with optimizations
// go build -ldflags="-s -w" -o cli main.go

// Results:
// - Startup time: 1-5ms
// - Binary size: 2-5MB
// - Memory usage: 10-20MB
```

### Binary Comparison Table

| Tool | Language | Startup Time | Binary Size | Memory Usage | Build Complexity |
|------|----------|--------------|-------------|--------------|------------------|
| Nuitka | Python | 10-50ms | 15-30MB | 30-50MB | Medium |
| pkg | Node.js | 20-40ms | 30-50MB | 40-60MB | Low |
| nexe | Node.js | 30-50ms | 40-60MB | 40-60MB | Low |
| PyInstaller | Python | 50-100ms | 20-40MB | 40-60MB | Low |
| Go | Go | 1-5ms | 2-5MB | 10-20MB | Low |
| Rust | Rust | 1-3ms | 1-3MB | 5-15MB | High |

## Caching Strategies

### 1. Filesystem Cache

```python
import json
import os
import time
from pathlib import Path

class CLICache:
    def __init__(self, cache_dir=None):
        self.cache_dir = cache_dir or Path.home() / '.cache' / 'your-cli'
        self.cache_dir.mkdir(parents=True, exist_ok=True)
    
    def get(self, key, max_age=3600):
        cache_file = self.cache_dir / f"{key}.json"
        
        if cache_file.exists():
            stat = cache_file.stat()
            if time.time() - stat.st_mtime < max_age:
                with open(cache_file) as f:
                    return json.load(f)
        
        return None
    
    def set(self, key, value):
        cache_file = self.cache_dir / f"{key}.json"
        with open(cache_file, 'w') as f:
            json.dump(value, f)

# Usage
cache = CLICache()

def get_user_data(user_id):
    # Check cache first
    data = cache.get(f"user_{user_id}")
    if data:
        return data
    
    # Expensive operation
    data = fetch_from_api(user_id)
    cache.set(f"user_{user_id}", data)
    return data
```

### 2. Memory Cache with LRU

```python
from functools import lru_cache
import hashlib

@lru_cache(maxsize=128)
def expensive_computation(input_data):
    # Cache up to 128 most recent results
    return process_data(input_data)

# For unhashable types
def cache_key(*args, **kwargs):
    return hashlib.md5(
        json.dumps([args, kwargs], sort_keys=True).encode()
    ).hexdigest()

_cache = {}

def cached_function(data):
    key = cache_key(data)
    if key in _cache:
        return _cache[key]
    
    result = expensive_function(data)
    _cache[key] = result
    return result
```

### 3. SQLite Cache

```python
import sqlite3
import json
import time

class SQLiteCache:
    def __init__(self, db_path):
        self.conn = sqlite3.connect(db_path)
        self.conn.execute('''
            CREATE TABLE IF NOT EXISTS cache (
                key TEXT PRIMARY KEY,
                value TEXT,
                timestamp REAL
            )
        ''')
        self.conn.commit()
    
    def get(self, key, max_age=3600):
        cursor = self.conn.execute(
            'SELECT value, timestamp FROM cache WHERE key = ?',
            (key,)
        )
        row = cursor.fetchone()
        
        if row and time.time() - row[1] < max_age:
            return json.loads(row[0])
        
        return None
    
    def set(self, key, value):
        self.conn.execute(
            'INSERT OR REPLACE INTO cache VALUES (?, ?, ?)',
            (key, json.dumps(value), time.time())
        )
        self.conn.commit()
```

## Memory Usage Optimization

### 1. Generator-Based Processing

```python
# Bad - loads entire file into memory
def process_large_file(filename):
    with open(filename) as f:
        lines = f.readlines()  # Could be gigabytes!
    
    for line in lines:
        process_line(line)

# Good - processes line by line
def process_large_file(filename):
    with open(filename) as f:
        for line in f:  # Generator, uses constant memory
            process_line(line)

# For JSON streaming
import ijson

def process_large_json(filename):
    with open(filename, 'rb') as f:
        parser = ijson.items(f, 'item')
        for item in parser:
            yield process_item(item)
```

### 2. Memory-Mapped Files

```python
import mmap

def search_in_large_file(filename, pattern):
    with open(filename, 'r+b') as f:
        with mmap.mmap(f.fileno(), 0, access=mmap.ACCESS_READ) as m:
            return m.find(pattern.encode())

# For structured data
import numpy as np

def process_binary_data(filename):
    # Memory-map the file instead of loading it
    data = np.memmap(filename, dtype='float32', mode='r')
    return data.mean()  # Computed without loading entire file
```

### 3. Object Pooling

```python
class ConnectionPool:
    def __init__(self, create_func, max_size=10):
        self.create_func = create_func
        self.pool = []
        self.max_size = max_size
    
    def acquire(self):
        if self.pool:
            return self.pool.pop()
        return self.create_func()
    
    def release(self, obj):
        if len(self.pool) < self.max_size:
            self.pool.append(obj)

# Usage
db_pool = ConnectionPool(lambda: sqlite3.connect('db.sqlite'))

def query_data():
    conn = db_pool.acquire()
    try:
        return conn.execute('SELECT * FROM users').fetchall()
    finally:
        db_pool.release(conn)
```

## Network Request Optimization

### 1. Connection Pooling

```python
import requests
from urllib3.util.retry import Retry
from requests.adapters import HTTPAdapter

class OptimizedSession:
    def __init__(self):
        self.session = requests.Session()
        
        # Connection pooling
        adapter = HTTPAdapter(
            pool_connections=10,
            pool_maxsize=10,
            max_retries=Retry(
                total=3,
                backoff_factor=0.3,
                status_forcelist=[500, 502, 503, 504]
            )
        )
        
        self.session.mount('http://', adapter)
        self.session.mount('https://', adapter)
    
    def get(self, url, **kwargs):
        return self.session.get(url, **kwargs)

# Global session for reuse
api_session = OptimizedSession()
```

### 2. Parallel Requests

```python
import asyncio
import aiohttp

async def fetch_multiple(urls):
    async with aiohttp.ClientSession() as session:
        tasks = [fetch_one(session, url) for url in urls]
        return await asyncio.gather(*tasks)

async def fetch_one(session, url):
    async with session.get(url) as response:
        return await response.json()

# Usage
urls = ['http://api1.com', 'http://api2.com', 'http://api3.com']
results = asyncio.run(fetch_multiple(urls))
```

### 3. Request Caching

```python
import requests_cache

# Cache responses for 1 hour
requests_cache.install_cache(
    'cli_cache',
    expire_after=3600,
    allowable_methods=['GET', 'POST'],
    allowable_codes=[200, 301, 302]
)

# Now all requests are automatically cached
response = requests.get('https://api.example.com/data')
```

## Case Studies: Fast CLIs

### 1. Why ripgrep is faster than grep

**Key Optimizations:**
- Written in Rust (zero-cost abstractions)
- Uses SIMD instructions for pattern matching
- Parallel directory traversal
- Smart literal string detection
- Memory-mapped file I/O
- Ignores binary files and .gitignore patterns by default

**Performance Comparison:**
```bash
# Searching Linux kernel source (30,000+ files)
time grep -r "TODO" .
# real    0m4.812s

time rg "TODO"
# real    0m0.402s

# 12x faster!
```

### 2. How exa optimizes over ls

**Key Optimizations:**
- Parallel file stat operations
- Lazy loading of file metadata
- Efficient color output handling
- Custom file sorting algorithms
- Minimal syscalls

**Performance Comparison:**
```bash
# Large directory with 10,000 files
time ls -la --color=always > /dev/null
# real    0m0.832s

time exa -la > /dev/null
# real    0m0.124s

# 6.7x faster!
```

### 3. fd vs find

**Key Optimizations:**
- Parallel filesystem traversal
- Regex compilation caching
- Smart .gitignore handling
- Efficient path building

**Performance Comparison:**
```bash
# Finding all Python files
time find . -name "*.py" -type f
# real    0m2.104s

time fd -e py
# real    0m0.215s

# 9.8x faster!
```

## Concrete Optimization Examples

### Example 1: Python CLI Startup Optimization

**Before (cli_slow.py):**
```python
#!/usr/bin/env python3
import argparse
import json
import requests
import pandas as pd
from rich.console import Console
from rich.table import Table
import numpy as np

console = Console()

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('command', choices=['hello', 'fetch', 'analyze'])
    args = parser.parse_args()
    
    if args.command == 'hello':
        console.print("Hello World!")
    elif args.command == 'fetch':
        response = requests.get('https://api.example.com/data')
        console.print(response.json())
    elif args.command == 'analyze':
        df = pd.DataFrame({'a': [1, 2, 3], 'b': [4, 5, 6]})
        console.print(df.describe())

if __name__ == '__main__':
    main()
```

**Measurement:**
```bash
$ hyperfine 'python cli_slow.py hello'
Benchmark #1: python cli_slow.py hello
  Time (mean ± σ):     412.3 ms ±  15.2 ms
```

**After (cli_fast.py):**
```python
#!/usr/bin/env python3
import argparse
import sys

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('command', choices=['hello', 'fetch', 'analyze'])
    args = parser.parse_args()
    
    if args.command == 'hello':
        print("Hello World!")
        sys.exit(0)
    
    # Lazy imports only when needed
    if args.command == 'fetch':
        import requests
        response = requests.get('https://api.example.com/data')
        print(response.json())
    
    elif args.command == 'analyze':
        import pandas as pd
        df = pd.DataFrame({'a': [1, 2, 3], 'b': [4, 5, 6]})
        print(df.describe())

if __name__ == '__main__':
    main()
```

**Measurement:**
```bash
$ hyperfine 'python cli_fast.py hello'
Benchmark #1: python cli_fast.py hello
  Time (mean ± σ):      31.2 ms ±   2.1 ms

# 13.2x faster startup!
```

### Example 2: Node.js Memory Optimization

**Before (memory_heavy.js):**
```javascript
const fs = require('fs');

function processLargeFile(filename) {
    // Loads entire file into memory
    const content = fs.readFileSync(filename, 'utf8');
    const lines = content.split('\n');
    
    let count = 0;
    for (const line of lines) {
        if (line.includes('ERROR')) {
            count++;
        }
    }
    
    return count;
}

// Memory usage: 500MB for a 500MB file
```

**After (memory_light.js):**
```javascript
const readline = require('readline');
const fs = require('fs');

async function processLargeFile(filename) {
    const fileStream = fs.createReadStream(filename);
    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
    });
    
    let count = 0;
    for await (const line of rl) {
        if (line.includes('ERROR')) {
            count++;
        }
    }
    
    return count;
}

// Memory usage: ~10MB regardless of file size
```

### Example 3: Binary Size Optimization

**Python + Nuitka Configuration:**
```python
# build_config.py
nuitka_options = [
    '--standalone',
    '--onefile',
    '--assume-yes-for-downloads',
    '--remove-output',
    '--enable-plugin=anti-bloat',
    '--nofollow-import-to=pandas',  # Exclude unless needed
    '--nofollow-import-to=numpy',
    '--nofollow-import-to=matplotlib',
    '--include-module=cli',
    '--include-module=cli.utils',
]

# Results:
# Before: 45MB (with all dependencies)
# After: 12MB (only required modules)
```

## Performance Checklist

### Pre-release Performance Validation

- [ ] Startup time < 100ms for simple commands
- [ ] Memory usage < 50MB for typical operations
- [ ] No memory leaks (test with long-running operations)
- [ ] Response time < 200ms for interactive commands
- [ ] Binary size < 10MB (compressed)
- [ ] CPU usage reasonable for the task
- [ ] Works well on slow/old hardware
- [ ] Handles large inputs gracefully
- [ ] Network timeouts configured appropriately
- [ ] Cache invalidation works correctly

### Continuous Performance Monitoring

```yaml
# .github/workflows/performance.yml
name: Performance Tests

on: [push, pull_request]

jobs:
  benchmark:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Run benchmarks
        run: |
          hyperfine --export-markdown bench.md \
            'python cli.py hello' \
            'node cli.js hello' \
            './cli-binary hello'
      
      - name: Check performance regression
        run: |
          python scripts/check_performance.py bench.md
```

## Conclusion

Performance optimization is an iterative process. Start with profiling to identify bottlenecks, apply targeted optimizations, and measure the impact. The techniques in this guide can reduce startup time by 10-50x and memory usage by 5-10x.

Remember: premature optimization is the root of all evil, but sluggish CLIs frustrate users daily. Profile first, optimize what matters, and maintain a great user experience.