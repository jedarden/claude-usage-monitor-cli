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
            const command = args.command || 'summary';
            const commandOptions = {
                quiet: args.options.quiet,
                includeEmpty: args.options['include-empty'],
                verbose: args.options.verbose
            };

            switch (command) {
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
            console.error('Usage: claude-monitor project <project-id>');
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
        
        console.log('Usage: claude-monitor [options] [command] [args...]\n');

        console.log('Commands:');
        console.log('  summary                 Show overall usage summary (default)');
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
        console.log('  claude-monitor                    # Show usage summary');
        console.log('  claude-monitor projects           # List all projects');
        console.log('  claude-monitor project my-proj   # Show project details');
        console.log('  claude-monitor today              # Show today\'s usage');
        console.log('  claude-monitor --timezone UTC     # Use UTC timezone');
        console.log('  claude-monitor --quiet summary    # Minimal output');
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