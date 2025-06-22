#!/usr/bin/env node

/**
 * Claude Usage Monitor CLI
 */

const { ArgumentParser } = require('./utils/args');
const { ClaudeUsageMonitor } = require('./monitor');
const { Colors } = require('./utils/terminal');
const { TimeZone } = require('./utils/timezone');
const { PlanConfig } = require('./plans');

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
        this.parser.addOption('plan', {
            alias: 'p',
            description: 'Claude plan type (pro, max5, max20, custom)',
            default: 'pro',
            choices: PlanConfig.listPlans()
        });

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

        this.parser.addFlag('once', {
            description: 'Run once and exit (no continuous monitoring)'
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
                plan: args.options.plan,
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
        const args = this.parser.parse(process.argv.slice(2));
        const isOnce = args.options.once;
        
        if (!options.quiet && !isOnce) {
            console.log(Colors.bright('📊 Claude Usage Monitor'));
            console.log(Colors.dim('Real-time monitoring - Press Ctrl+C to exit\n'));
        }
        
        try {
            // Initial display
            await this.displayMonitorData(monitor, options);
            
            if (isOnce) {
                // Run once and exit
                return 0;
            }
            
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
        try {
            const usageData = monitor.dataReader.getAllUsageData();
            const totals = usageData.totals;
            
            // Get plan limits
            const plan = monitor.plan || PlanConfig.getPlan('pro');
            const dailyLimit = plan.daily_limit;
            const windowLimit = plan.limit_per_5h;
            const dailyPercent = (totals.requestCount / dailyLimit * 100).toFixed(1);
            const windowPercent = Math.min((totals.requestCount / 5 / windowLimit * 100), 100).toFixed(1);
            
            // Header
            console.log(Colors.bright(Colors.cyan(`📊 Claude Usage Monitor - ${plan.name}`)));
            console.log(Colors.dim('=================================='));
            
            // Current window
            const barWidth = 30;
            const windowFilled = Math.min(Math.floor((parseFloat(windowPercent) / 100) * barWidth), barWidth);
            const windowBar = '█'.repeat(windowFilled) + '░'.repeat(Math.max(0, barWidth - windowFilled));
            
            let coloredWindowBar;
            if (parseFloat(windowPercent) < 50) coloredWindowBar = Colors.green(windowBar);
            else if (parseFloat(windowPercent) < 80) coloredWindowBar = Colors.yellow(windowBar);
            else coloredWindowBar = Colors.red(windowBar);
            
            const currentWindowMessages = Math.floor(totals.requestCount / 5);
            console.log(`\n${Colors.bright('5-Hour Window')}`);
            console.log(`[${coloredWindowBar}] ${currentWindowMessages}/${windowLimit} (${windowPercent}%) • Resets in ~5h`);
            
            // Calculate burn rate and predictions
            const burnRatePerHour = totals.requestCount / 24; // Simplified: total requests over 24 hours
            if (burnRatePerHour > 0) {
                let burnInfo = `Burn rate: ${burnRatePerHour.toFixed(1)}/hr`;
                
                // Time to hit window limit
                if (currentWindowMessages < windowLimit) {
                    const messagesRemaining = windowLimit - currentWindowMessages;
                    const hoursToLimit = messagesRemaining / burnRatePerHour;
                    if (hoursToLimit < 24) {
                        const timeToLimit = hoursToLimit < 1 
                            ? `${Math.floor(hoursToLimit * 60)}m`
                            : `${Math.floor(hoursToLimit)}h ${Math.floor((hoursToLimit % 1) * 60)}m`;
                        burnInfo += ` • Limit in ${timeToLimit}`;
                    }
                }
                console.log(burnInfo);
            }
            
            // Daily summary
            const dailyFilled = Math.min(Math.floor((parseFloat(dailyPercent) / 100) * barWidth), barWidth);
            const dailyBar = '█'.repeat(dailyFilled) + '░'.repeat(Math.max(0, barWidth - dailyFilled));
            
            let coloredDailyBar;
            if (parseFloat(dailyPercent) < 50) coloredDailyBar = Colors.green(dailyBar);
            else if (parseFloat(dailyPercent) < 80) coloredDailyBar = Colors.yellow(dailyBar);
            else coloredDailyBar = Colors.red(dailyBar);
            
            console.log(`\n${Colors.bright('Daily Total')}`);
            console.log(`[${coloredDailyBar}] ${totals.requestCount}/${dailyLimit} (${dailyPercent}%)`);
            
            // Reset info
            const now = new Date();
            const utcHours = now.getUTCHours();
            const hoursUntilReset = utcHours < 9 ? 9 - utcHours : 33 - utcHours; // Reset at 9 UTC
            const resetTime = hoursUntilReset < 1 
                ? `${Math.floor(hoursUntilReset * 60)}m`
                : `${Math.floor(hoursUntilReset)}h ${Math.floor((hoursUntilReset % 1) * 60)}m`;
            console.log(`Resets at 09:00 UTC (${resetTime})`);
            
            // Tokens (compact)
            console.log(`\n${Colors.bright('Tokens:')} ${this.formatNumber(totals.totalTokens)} total • ${this.formatNumber(totals.outputTokens)} out • ${this.formatNumber(totals.cacheReadTokens)} cache`);
            
            // Status
            process.stdout.write(`\n${Colors.bright('Status:')} `);
            if (parseFloat(dailyPercent) > 90 || parseFloat(windowPercent) > 90) {
                console.log(Colors.red('⚠️  Limit approaching!'));
            } else if (parseFloat(dailyPercent) > 75 || parseFloat(windowPercent) > 75) {
                console.log(Colors.yellow('Usage high'));
            } else {
                console.log(Colors.green('✓ Normal'));
            }
            
            // Footer
            const timeStr = now.toTimeString().split(' ')[0];
            console.log(`\n${Colors.dim(`Updated: ${timeStr} • Ctrl+C to exit`)}`);
        } catch (error) {
            console.error('Error in displayMonitorData:', error);
            throw error;
        }
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
        console.log('  -p, --plan <plan>       Claude plan (pro, max5, max20, custom)');
        console.log('  -t, --timezone <tz>     Timezone for date formatting (default: system)');
        console.log('  -c, --config-dir <dir>  Claude configuration directory');
        console.log('  --project-id <id>       Specific project ID to analyze');
        console.log('  -v, --verbose           Verbose output');
        console.log('  -q, --quiet             Quiet mode - minimal output');
        console.log('  --once                  Run once and exit');
        console.log('  --no-color              Disable colored output');
        console.log('  --include-empty         Include projects with no usage');
        console.log('  -h, --help              Show this help message');
        console.log('  --version               Show version information');
        console.log();

        console.log('Examples:');
        console.log('  claude-usage-cli                    # Real-time monitoring');
        console.log('  claude-usage-cli --once             # Run once and exit');
        console.log('  claude-usage-cli --plan max5        # Monitor with Max5 plan');
        console.log('  claude-usage-cli summary            # Show usage summary');
        console.log('  claude-usage-cli projects           # List all projects');
        console.log('  claude-usage-cli today              # Show today\'s usage');
        console.log('  claude-usage-cli --timezone UTC     # Use UTC timezone');
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