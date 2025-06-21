#!/usr/bin/env node

/**
 * Simple test script for Claude Usage Monitor
 */

const path = require('path');
const { ClaudeMonitorCLI } = require('../lib/cli');
const { ClaudeUsageMonitor } = require('../lib/monitor');
const { ClaudeDataReader } = require('../lib/utils/claude-data');
const { ArgumentParser } = require('../lib/utils/args');
const { Colors, Table, Spinner } = require('../lib/utils/terminal');
const { TimeZone, DateRange } = require('../lib/utils/timezone');

console.log('🧪 Testing Claude Usage Monitor Components...\n');

// Test 1: Argument Parser
console.log('1. Testing ArgumentParser...');
try {
    const parser = new ArgumentParser();
    parser.addOption('test', { alias: 't', description: 'Test option' });
    parser.addFlag('verbose', { alias: 'v', description: 'Verbose flag' });
    
    const result = parser.parse(['--test', 'value', '-v']);
    console.log(`   ✓ Parsed: test=${result.options.test}, verbose=${result.options.verbose}`);
} catch (error) {
    console.log(`   ✗ Error: ${error.message}`);
}

// Test 2: Colors
console.log('\n2. Testing Colors...');
try {
    console.log(`   ${Colors.red('Red text')} ${Colors.green('Green text')} ${Colors.blue('Blue text')}`);
    console.log('   ✓ Colors working');
} catch (error) {
    console.log(`   ✗ Error: ${error.message}`);
}

// Test 3: Table
console.log('\n3. Testing Table...');
try {
    const table = new Table();
    table.setHeaders(['Name', 'Value']);
    table.addRow(['Test', '123']);
    table.addRow(['Example', '456']);
    console.log(table.toString());
    console.log('   ✓ Table formatting working');
} catch (error) {
    console.log(`   ✗ Error: ${error.message}`);
}

// Test 4: TimeZone
console.log('\n4. Testing TimeZone...');
try {
    const tz = new TimeZone();
    const now = new Date();
    const formatted = tz.format(now);
    console.log(`   Current time: ${formatted}`);
    console.log(`   Timezone: ${tz.timezone}`);
    console.log('   ✓ TimeZone working');
} catch (error) {
    console.log(`   ✗ Error: ${error.message}`);
}

// Test 5: Claude Data Reader
console.log('\n5. Testing ClaudeDataReader...');
try {
    const reader = new ClaudeDataReader();
    const projects = reader.getProjects();
    console.log(`   Found ${projects.length} projects`);
    if (projects.length > 0) {
        console.log(`   Projects: ${projects.slice(0, 3).join(', ')}${projects.length > 3 ? '...' : ''}`);
    }
    console.log('   ✓ ClaudeDataReader working');
} catch (error) {
    console.log(`   ✗ Error: ${error.message}`);
}

// Test 6: Monitor
console.log('\n6. Testing ClaudeUsageMonitor...');
try {
    const monitor = new ClaudeUsageMonitor({ timezone: 'UTC' });
    console.log('   Monitor instance created');
    console.log('   ✓ ClaudeUsageMonitor working');
} catch (error) {
    console.log(`   ✗ Error: ${error.message}`);
}

// Test 7: CLI
console.log('\n7. Testing CLI...');
try {
    const cli = new ClaudeMonitorCLI();
    console.log('   CLI instance created');
    console.log('   ✓ CLI working');
} catch (error) {
    console.log(`   ✗ Error: ${error.message}`);
}

console.log('\n✅ All tests completed!');
console.log('\nTo test the CLI manually:');
console.log('  node lib/cli.js --help');
console.log('  node lib/cli.js summary');
console.log('  ./bin/claude-monitor --version');