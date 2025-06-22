#!/usr/bin/env node

/**
 * Claude Usage Monitor CLI
 */

const { ArgumentParser } = require('./utils/args');
const { ClaudeUsageMonitor } = require('./monitor');
const { Colors } = require('./utils/terminal');
const { TimeZone } = require('./utils/timezone');

class ClaudeMonitorCLI {
    constructor() {
        this.parser = new ArgumentParser();
        this.setupArguments();
    }

    setupArguments() {
        // Commands
        this.parser.addCommand('monitor');
        this.parser.addCommand('summary');
        this.parser.addCommand('project');
        this.parser.addCommand('projects');
        this.parser.addCommand('today');
        this.parser.addCommand('week');
        this.parser.addCommand('month');
        this.parser.addCommand('cache');

        // Global options
        this.parser.addOption('timezone', {
            alias: 't',
            description: 'Timezone for date formatting',
            default: TimeZone.getCurrentTimezone()
        });

        this.parser.addOption('config-dir', {
            alias: 'c',
            description: 'Claude configuration directory',
            default: null
        });

        this.parser.addFlag('verbose', {
            alias: 'v',
            description: 'Verbose output'
        });

        this.parser.addFlag('quiet', {
            alias: 'q',
            description: 'Quiet mode - minimal output'
        });

        this.parser.addFlag('no-color', {
            description: 'Disable colored output'
        });

        this.parser.addFlag('include-empty', {
            description: 'Include projects with no usage'
        });

        this.parser.addFlag('help', {
            alias: 'h',
            description: 'Show help message'
        });

        this.parser.addFlag('version', {
            description: 'Show version information'
        });

        // Project-specific options
        this.parser.addOption('project-id', {
            alias: 'p',
            description: 'Specific project ID to analyze'
        });
    }

    async run(argv = process.argv.slice(2)) {
        try {
            const args = this.parser.parse(argv);

            if (args.options.help) {
                this.showHelp();
                return 0;
            }

            if (args.options.version) {
                this.showVersion();
                return 0;
            }

            // Validate timezone
            if (!TimeZone.isValidTimezone(args.options.timezone)) {
                console.error(Colors.red(`Error: Invalid timezone '${args.options.timezone}'`));
                console.error('Use a valid timezone like "America/New_York" or "UTC"');
                return 1;
            }

            // Create monitor instance
            const monitorOptions = {
                timezone: args.options.timezone,
                verbose: args.options.verbose,
                baseDir: args.options['config-dir']
            };

            const monitor = new ClaudeUsageMonitor(monitorOptions);

            // Handle commands
            const command = args.command || 'monitor'; // Default to monitor mode
            const commandOptions = {
                quiet: args.options.quiet,
                includeEmpty: args.options['include-empty'],
                verbose: args.options.verbose
            };

            switch (command) {
                case 'monitor':
                    return await this.handleMonitor(monitor, commandOptions);
                    
                case 'summary':
                    return await this.handleSummary(monitor, commandOptions);
                
                case 'project':
                    return await this.handleProject(monitor, args.options['project-id'] || args.args[0], commandOptions);
                
                case 'projects':
                    return await this.handleProjects(monitor, commandOptions);
                
                case 'today':
                    return await this.handlePeriod(monitor, 'today', commandOptions);
                
                case 'week':
                    return await this.handlePeriod(monitor, 'week', commandOptions);
                
                case 'month':
                    return await this.handlePeriod(monitor, 'month', commandOptions);
                
                case 'cache':
                    return await this.handleCache(monitor, args.args[0], commandOptions);
                
                default:
                    console.error(Colors.red(`Unknown command: ${command}`));
                    this.showHelp();
                    return 1;
            }

        } catch (error) {
            if (error.message.includes('Unknown option') || error.message.includes('requires a value')) {
                console.error(Colors.red(`Error: ${error.message}`));
                console.error('Use --help for usage information');
                return 1;
            }

            console.error(Colors.red(`Error: ${error.message}`));
            
            if (process.env.NODE_ENV === 'development') {
                console.error(error.stack);
            }
            
            return 1;
        }
    }

    async handleMonitor(monitor, options) {
        if (!options.quiet) {
            console.log(Colors.bright('📊 Claude Usage Monitor'));
            console.log(Colors.dim('Real-time monitoring - Press Ctrl+C to exit\n'));
        }
        
        try {
            // Initial display
            await this.displayMonitorData(monitor, options);
            
            // Set up interval for updates
            const interval = setInterval(async () => {
                // Clear screen
                process.stdout.write('\x1b[2J\x1b[H');
                await this.displayMonitorData(monitor, options);
            }, 5000); // Update every 5 seconds
            
            // Handle Ctrl+C gracefully
            process.on('SIGINT', () => {
                clearInterval(interval);
                console.log(Colors.dim('\n\nMonitoring stopped.'));
                process.exit(0);
            });
            
            // Keep process running
            await new Promise(() => {});
            
        } catch (error) {
            console.error(Colors.red(`Monitoring error: ${error.message}`));
            return 1;
        }
    }
    
    async displayMonitorData(monitor, options) {
        const usageData = monitor.dataReader.getAllUsageData();
        const totals = usageData.totals;
        
        // Calculate percentages (simplified for now)
        const dailyLimit = 5000; // Pro plan daily limit
        const windowLimit = 1000; // Pro plan 5-hour limit
        const dailyPercent = (totals.requestCount / dailyLimit * 100).toFixed(1);
        const windowPercent = Math.min((totals.requestCount / 5 / windowLimit * 100), 100).toFixed(1);
        
        // Header
        console.log(Colors.bright(Colors.cyan('📊 Claude Usage Monitor - Pro Plan')));
        console.log(Colors.dim('==================================\n'));
        
        // Current window
        console.log(Colors.bright('📅 Current 5-Hour Window'));
        
        // Progress bar
        const barWidth = 30;
        const windowFilled = Math.floor((windowPercent / 100) * barWidth);
        const windowBar = '█'.repeat(windowFilled) + '░'.repeat(barWidth - windowFilled);
        
        let barColor;
        if (windowPercent < 50) barColor = Colors.green;
        else if (windowPercent < 80) barColor = Colors.yellow;
        else barColor = Colors.red;
        
        console.log(`   API Messages: [${barColor(windowBar)}] ${Math.floor(totals.requestCount / 5)}/${windowLimit} (${windowPercent}%)`);
        console.log();
        
        // Daily summary
        console.log(Colors.bright('📊 Daily Summary'));
        
        const dailyFilled = Math.floor((dailyPercent / 100) * barWidth);
        const dailyBar = '█'.repeat(dailyFilled) + '░'.repeat(barWidth - dailyFilled);
        
        let dailyBarColor;
        if (dailyPercent < 50) dailyBarColor = Colors.green;
        else if (dailyPercent < 80) dailyBarColor = Colors.yellow;
        else dailyBarColor = Colors.red;
        
        console.log(`   API Messages: [${dailyBarColor(dailyBar)}] ${totals.requestCount}/${dailyLimit} (${dailyPercent}%)\n`);
        
        // Token usage
        console.log(Colors.bright('💰 Token Usage'));
        console.log(`   Total: ${this.formatNumber(totals.totalTokens)}`);
        console.log(`   Input: ${this.formatNumber(totals.inputTokens)}`);
        console.log(`   Output: ${this.formatNumber(totals.outputTokens)}`);
        if (totals.cacheCreationTokens > 0) {
            console.log(`   Cache Creation: ${this.formatNumber(totals.cacheCreationTokens)}`);
        }
        if (totals.cacheReadTokens > 0) {
            console.log(`   Cache Read: ${this.formatNumber(totals.cacheReadTokens)}`);
        }
        console.log();
        
        // Status
        console.log(Colors.bright('📈 Status'));
        if (dailyPercent > 90 || windowPercent > 90) {
            console.log(`   ${Colors.red('⚠️  Usage limit nearly exceeded!')}`);
        } else if (dailyPercent > 75 || windowPercent > 75) {
            console.log(`   ${Colors.yellow('⚠️  Usage is high')}`);
        } else {
            console.log(`   ${Colors.green('✓ Usage within normal limits')}`);
        }
        console.log();
        
        // Footer
        const now = new Date();
        const timeStr = now.toTimeString().split(' ')[0];
        console.log(Colors.dim(`Last updated: ${timeStr} | Press Ctrl+C to exit`));
    }
    
    formatNumber(num) {
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + 'M';
        } else if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'K';
        }
        return num.toString();
    }

    async handleSummary(monitor, options) {
        try {
            const summary = await monitor.getSummary(options);
            
            if (!options.quiet) {
                console.log(Colors.bright('\n📊 Claude Usage Summary\n'));
            }
            
            console.log(summary.formatted);
            
            if (options.verbose) {
                console.log(Colors.dim(`\nCache: ${monitor.getCacheStats().size} entries`));
            }
            
            return 0;
        } catch (error) {
            console.error(Colors.red(`Failed to get summary: ${error.message}`));
            return 1;
        }
    }

    async handleProject(monitor, projectId, options) {
        if (!projectId) {
            console.error(Colors.red('Error: Project ID is required'));
            console.error('Usage: claude-usage-cli project <project-id>');
            return 1;
        }

        try {
            const result = await monitor.getProjectDetails(projectId, options);
            
            if (result.error) {
                console.error(Colors.red(`Error: ${result.error}`));
                return 1;
            }
            
            if (!options.quiet) {
                console.log(Colors.bright(`\n📁 Project: ${projectId}\n`));
            }
            
            console.log(result.formatted);
            
            return 0;
        } catch (error) {
            console.error(Colors.red(`Failed to get project details: ${error.message}`));
            return 1;
        }
    }

    async handleProjects(monitor, options) {
        try {
            const result = await monitor.listProjects(options);
            
            if (!options.quiet) {
                console.log(Colors.bright('\n📋 All Projects\n'));
            }
            
            console.log(result.formatted);
            
            if (options.verbose) {
                console.log(Colors.dim(`\nTotal projects: ${result.projects.length}`));
            }
            
            return 0;
        } catch (error) {
            console.error(Colors.red(`Failed to list projects: ${error.message}`));
            return 1;
        }
    }

    async handlePeriod(monitor, period, options) {
        try {
            const result = await monitor.getUsageByPeriod(period, options);
            
            if (!options.quiet) {
                const periodName = period.charAt(0).toUpperCase() + period.slice(1);
                console.log(Colors.bright(`\n📅 ${periodName} Usage\n`));
                console.log(Colors.dim(`Period: ${result.dateRange.formatted}\n`));
            }
            
            console.log(result.formatted);
            
            return 0;
        } catch (error) {
            console.error(Colors.red(`Failed to get ${period} usage: ${error.message}`));
            return 1;
        }
    }

    async handleCache(monitor, action, options) {
        switch (action) {
            case 'clear':
                monitor.clearCache();
                if (!options.quiet) {
                    console.log(Colors.green('✓ Cache cleared'));
                }
                return 0;
                
            case 'stats':
            case 'info':
            default:
                const stats = monitor.getCacheStats();
                console.log(`Cache entries: ${stats.size}`);
                console.log(`Cache timeout: ${stats.timeout}ms`);
                return 0;
        }
    }

    showHelp() {
        console.log(Colors.bright('Claude Usage Monitor'));
        console.log('Monitor your Claude API usage from local conversation files\n');
        
        console.log('Usage: claude-usage-cli [options] [command] [args...]\n');

        console.log('Commands:');
        console.log('  monitor                 Real-time usage monitoring (default)');
        console.log('  summary                 Show overall usage summary');
        console.log('  project <project-id>    Show detailed usage for a specific project');
        console.log('  projects                List all projects with usage');
        console.log('  today                   Show today\'s usage');
        console.log('  week                    Show this week\'s usage');
        console.log('  month                   Show this month\'s usage');
        console.log('  cache [clear|stats]     Manage cache (clear or show stats)');
        console.log();

        console.log('Options:');
        console.log('  -t, --timezone <tz>     Timezone for date formatting (default: system)');
        console.log('  -c, --config-dir <dir>  Claude configuration directory');
        console.log('  -p, --project-id <id>   Specific project ID to analyze');
        console.log('  -v, --verbose           Verbose output');
        console.log('  -q, --quiet             Quiet mode - minimal output');
        console.log('  --no-color              Disable colored output');
        console.log('  --include-empty         Include projects with no usage');
        console.log('  -h, --help              Show this help message');
        console.log('  --version               Show version information');
        console.log();

        console.log('Examples:');
        console.log('  claude-usage-cli                    # Real-time monitoring');
        console.log('  claude-usage-cli summary            # Show usage summary');
        console.log('  claude-usage-cli projects           # List all projects');
        console.log('  claude-usage-cli project my-proj   # Show project details');
        console.log('  claude-usage-cli today              # Show today\'s usage');
        console.log('  claude-usage-cli --timezone UTC     # Use UTC timezone');
        console.log('  claude-usage-cli --quiet summary    # Minimal output');
    }

    showVersion() {
        const packageInfo = require('../package.json');
        console.log(`${packageInfo.name} v${packageInfo.version}`);
        console.log(`Node.js ${process.version}`);
        console.log(`Platform: ${process.platform} ${process.arch}`);
    }
}

// Run CLI if this file is executed directly
if (require.main === module) {
    const cli = new ClaudeMonitorCLI();
    cli.run().then(exitCode => {
        process.exit(exitCode);
    }).catch(error => {
        console.error(Colors.red(`Fatal error: ${error.message}`));
        process.exit(1);
    });
}

module.exports = {
    ClaudeMonitorCLI
};