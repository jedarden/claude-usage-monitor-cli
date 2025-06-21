# CLI UX Design Patterns and Best Practices

## Table of Contents
1. [Command Naming Conventions](#command-naming-conventions)
2. [Command Structure Patterns](#command-structure-patterns)
3. [Argument and Flag Design](#argument-and-flag-design)
4. [Interactive CLI Elements](#interactive-cli-elements)
5. [Progress and Status Indication](#progress-and-status-indication)
6. [Error Message Guidelines](#error-message-guidelines)
7. [Help System Design](#help-system-design)
8. [Configuration Management](#configuration-management)
9. [Before/After Examples](#beforeafter-examples)

## Command Naming Conventions

### Principles
- **Clarity over brevity**: `git status` vs `git s`
- **Verb-noun pattern**: `docker run`, `npm install`, `kubectl get`
- **Consistent vocabulary**: Use same verbs across commands
- **Memorable and guessable**: Users should intuit command names

### Common Verb Patterns
```bash
# CRUD Operations
create/new    # Create resources
get/list      # Read/retrieve resources
update/set    # Modify resources
delete/remove # Remove resources

# Action Verbs
run/exec      # Execute operations
start/stop    # Control processes
install/uninstall # Package management
push/pull     # Sync operations
```

### Examples from Popular Tools
```bash
# Git - Clear verb-noun pattern
git add <file>
git commit -m "message"
git push origin main

# Docker - Consistent naming
docker run nginx
docker stop container-id
docker images list

# npm - Action-oriented
npm install package
npm run script
npm publish
```

## Command Structure Patterns

### 1. Git-Style (Subcommands)
```bash
cli-tool <command> <subcommand> [options] [arguments]

# Examples
git remote add origin https://github.com/user/repo
aws s3 cp file.txt s3://bucket/
kubectl get pods --namespace=default
```

**Pros:**
- Hierarchical organization
- Scales well for complex CLIs
- Clear command grouping

**Cons:**
- Can become deeply nested
- Requires more typing

### 2. Traditional Unix Style
```bash
command [options] [arguments]

# Examples
ls -la /home
grep -r "pattern" .
cp -r source/ destination/
```

**Pros:**
- Simple and familiar
- Quick to type
- Easy to chain with pipes

**Cons:**
- Limited scalability
- Can lead to option explosion

### 3. Hybrid Approach
```bash
# Combines subcommands with traditional options
npm install --save-dev typescript
cargo build --release
yarn add react --peer
```

## Argument and Flag Design

### Flag Conventions
```bash
# Short flags (single dash, single letter)
-v              # verbose
-h              # help
-f              # force

# Long flags (double dash, descriptive)
--verbose       # Same as -v
--help          # Same as -h
--force         # Same as -f

# Combining short flags
ls -la          # Same as ls -l -a

# Flag with values
--output=file.txt    # Equals sign
--output file.txt    # Space separated
-o file.txt          # Short form
```

### Best Practices
1. **Provide both short and long forms** for common flags
2. **Use standard flags** (-h/--help, -v/--version, -q/--quiet)
3. **Be consistent** with value assignment (= vs space)
4. **Group related flags** logically

### Positional Arguments
```bash
# Clear order and purpose
cp <source> <destination>
git checkout <branch>
docker run <image> <command>

# Optional vs required
cli-tool <required> [optional]
```

## Interactive CLI Elements

### 1. Prompts and Confirmations
```bash
# Simple yes/no prompt
$ rm -i important.txt
remove important.txt? (y/n) 

# Multi-choice selection
$ npm init
package name: (my-project) 
version: (1.0.0) 
description: My awesome project
entry point: (index.js) 

# Password input (hidden)
$ sudo apt update
[sudo] password for user: ****
```

### 2. Interactive Menus
```bash
# Arrow-key navigation
? Select your preferred package manager (Use arrow keys)
❯ npm
  yarn
  pnpm

# Checkbox selection
? Select features to install (Press <space> to select)
◯ TypeScript
◉ ESLint
◯ Prettier
◉ Testing
```

### 3. Autocomplete and Suggestions
```bash
# Tab completion
$ git ch<TAB>
checkout  cherry-pick  

# Did you mean?
$ git statsu
git: 'statsu' is not a git command. See 'git --help'.

The most similar command is
    status
```

## Progress and Status Indication

### 1. Progress Bars
```bash
# Determinate progress
Downloading... ████████████████████░░░░░░ 80% | 40MB/50MB | ETA: 2s

# Indeterminate progress
Processing... ⠙ (spinner animation)
```

### 2. Status Messages
```bash
# Step-by-step progress
✓ Dependencies installed
✓ TypeScript configured
⠙ Building project...
✗ Tests failed

# Verbose output with levels
[INFO] Starting build process
[WARN] Deprecated API usage detected
[ERROR] Build failed: missing dependency
```

### 3. Real-time Updates
```bash
# Live logs
$ docker logs -f container
2024-01-15 10:23:45 [INFO] Server started
2024-01-15 10:23:46 [INFO] Accepting connections...

# Progress with context
$ npm install
⠹ fetchMetadata: sill resolveWithNewModule react@18.2.0
```

## Error Message Guidelines

### Principles
1. **Be specific** about what went wrong
2. **Suggest solutions** when possible
3. **Provide context** for the error
4. **Use appropriate tone** (helpful, not condescending)

### Error Message Structure
```bash
# Good error message format
Error: <what went wrong>
  <why it went wrong>
  <how to fix it>

# Example
Error: Cannot find module 'express'
  The package 'express' is not installed in your project.
  
  To fix this, run:
    npm install express
```

### Examples of Good Error Messages
```bash
# Git - Clear and actionable
$ git push
fatal: The current branch main has no upstream branch.
To push the current branch and set the remote as upstream, use

    git push --set-upstream origin main

# npm - Helpful suggestions
$ npm start
npm ERR! missing script: start
npm ERR! 
npm ERR! Did you mean one of these?
npm ERR!     npm run test
npm ERR!     npm run build

# Docker - Contextual information
$ docker run myapp
Unable to find image 'myapp:latest' locally
docker: Error response from daemon: pull access denied for myapp, 
repository does not exist or may require 'docker login'.
```

## Help System Design

### 1. Help Command Structure
```bash
# Global help
$ cli-tool --help
Usage: cli-tool <command> [options]

Commands:
  init      Initialize a new project
  build     Build the project
  test      Run tests
  deploy    Deploy to production

Options:
  -h, --help     Show help
  -v, --version  Show version
  --verbose      Enable verbose output

Run 'cli-tool <command> --help' for more information on a command.

# Command-specific help
$ cli-tool build --help
Usage: cli-tool build [options]

Build the project for production

Options:
  -o, --output <dir>    Output directory (default: ./dist)
  --minify              Minify output files
  --source-maps         Generate source maps
  --watch               Watch for changes

Examples:
  $ cli-tool build
  $ cli-tool build --output ./public
  $ cli-tool build --minify --source-maps
```

### 2. Documentation Features
- **Usage examples** for common scenarios
- **Option descriptions** with defaults
- **Related commands** section
- **Links to online documentation**

## Configuration Management

### 1. Configuration File Locations
```bash
# Priority order (first found wins)
1. Command line flags         # --config=custom.json
2. Local project config       # ./claude-monitor.config.json
3. User home directory        # ~/.claude-monitor/config.json
4. System-wide config         # /etc/claude-monitor/config.json
```

### 2. Configuration Formats

#### JSON Configuration
```json
{
  "apiKey": "your-api-key",
  "output": {
    "format": "json",
    "file": "./usage-report.json"
  },
  "monitoring": {
    "interval": 300,
    "metrics": ["tokens", "cost", "requests"]
  }
}
```

#### YAML Configuration
```yaml
apiKey: your-api-key
output:
  format: json
  file: ./usage-report.json
monitoring:
  interval: 300
  metrics:
    - tokens
    - cost
    - requests
```

#### Environment Variables
```bash
CLAUDE_API_KEY=your-api-key
CLAUDE_OUTPUT_FORMAT=json
CLAUDE_MONITORING_INTERVAL=300
```

### 3. Configuration Commands
```bash
# View configuration
cli-tool config list
cli-tool config get <key>

# Set configuration
cli-tool config set api.key "new-key"
cli-tool config set output.format json

# Configuration file management
cli-tool config --edit              # Opens in $EDITOR
cli-tool config --validate          # Checks syntax
cli-tool config --show-path         # Shows active config file
```

## Before/After Examples

### Example 1: Improving Error Messages

**Before:**
```bash
$ claude-monitor analyze
Error: Failed
```

**After:**
```bash
$ claude-monitor analyze
Error: API authentication failed

The API key is either missing or invalid.

To fix this:
1. Set your API key: claude-monitor config set apiKey "your-key"
2. Or use environment variable: export CLAUDE_API_KEY="your-key"

For more information, see: https://docs.claude-monitor.dev/auth
```

### Example 2: Better Progress Indication

**Before:**
```bash
$ claude-monitor export
Processing...
Done
```

**After:**
```bash
$ claude-monitor export
Exporting usage data...
  ✓ Fetching data from API (2.3s)
  ✓ Processing 1,234 requests
  ✓ Calculating usage metrics
  ✓ Generating report

Report exported to: ./reports/usage-2024-01-15.json
Total tokens used: 45,678
Estimated cost: $12.34
```

### Example 3: Improved Command Structure

**Before:**
```bash
$ claude-monitor -x json -o output.json -s 2024-01-01 -e 2024-01-31 -v
```

**After:**
```bash
$ claude-monitor export \
    --format json \
    --output ./reports/january-2024.json \
    --start-date 2024-01-01 \
    --end-date 2024-01-31 \
    --verbose
```

### Example 4: Interactive Configuration

**Before:**
```bash
$ claude-monitor init
Config created at ~/.claude-monitor/config.json
Edit the file to add your API key.
```

**After:**
```bash
$ claude-monitor init
Welcome to Claude Monitor! Let's set up your configuration.

? Enter your Claude API key: ********
? Select default output format: (Use arrow keys)
❯ JSON
  CSV
  Markdown
  
? Enable real-time monitoring? (Y/n) Y
? Monitoring interval in seconds: (300) 

✓ Configuration saved to ~/.claude-monitor/config.json
✓ API key validated successfully

You're all set! Try these commands:
  claude-monitor status    - Check current usage
  claude-monitor analyze   - Analyze usage patterns
  claude-monitor export    - Export usage report
```

## Summary of Best Practices

1. **Consistency is key** - Use consistent patterns throughout your CLI
2. **Progressive disclosure** - Show simple options first, advanced later
3. **Fail gracefully** - Provide helpful error messages with solutions
4. **Respect user time** - Make common operations fast and simple
5. **Follow conventions** - Use familiar patterns from popular tools
6. **Document thoroughly** - Provide examples in help text
7. **Be predictable** - Users should be able to guess command behavior
8. **Provide feedback** - Always show progress for long operations
9. **Support both beginners and experts** - Interactive mode and shortcuts
10. **Test with real users** - Observe how people actually use your CLI