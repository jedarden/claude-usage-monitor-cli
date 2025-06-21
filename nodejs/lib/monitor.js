/**
 * Core monitoring logic
 */

const { ClaudeDataReader } = require('./utils/claude-data');
const { TimeZone, DateRange } = require('./utils/timezone');
const { Colors, Table, Spinner } = require('./utils/terminal');

class ClaudeUsageMonitor {
    constructor(options = {}) {
        this.dataReader = new ClaudeDataReader(options);
        this.timezone = new TimeZone(options.timezone);
        this.verbose = options.verbose || false;
    }

    /**
     * Get usage summary
     */
    async getSummary(options = {}) {
        const spinner = new Spinner({ text: 'Loading Claude usage data...' });
        
        if (!options.quiet) {
            spinner.start();
        }

        try {
            const usageData = this.dataReader.getAllUsageData();
            
            if (!options.quiet) {
                spinner.succeed('Usage data loaded successfully');
            }

            return this.formatSummary(usageData, options);
        } catch (error) {
            if (!options.quiet) {
                spinner.fail(`Error loading usage data: ${error.message}`);
            }
            throw error;
        }
    }

    /**
     * Format usage summary
     */
    formatSummary(usageData, options = {}) {
        const summary = {
            totals: usageData.totals,
            projects: Object.keys(usageData.projects).length,
            timeRange: usageData.timeRange,
            models: usageData.models,
            formatted: this.createSummaryTable(usageData, options)
        };

        return summary;
    }

    /**
     * Create summary table
     */
    createSummaryTable(usageData, options = {}) {
        const table = new Table({ border: true });
        
        // Overall totals
        table.setHeaders(['Metric', 'Value']);
        table.addRow(['Total Tokens', this.formatNumber(usageData.totals.totalTokens)]);
        table.addRow(['Input Tokens', this.formatNumber(usageData.totals.inputTokens)]);
        table.addRow(['Output Tokens', this.formatNumber(usageData.totals.outputTokens)]);
        
        if (usageData.totals.cacheCreationTokens > 0) {
            table.addRow(['Cache Creation Tokens', this.formatNumber(usageData.totals.cacheCreationTokens)]);
        }
        
        if (usageData.totals.cacheReadTokens > 0) {
            table.addRow(['Cache Read Tokens', this.formatNumber(usageData.totals.cacheReadTokens)]);
        }
        
        table.addRow(['Total Requests', this.formatNumber(usageData.totals.requestCount)]);
        table.addRow(['Active Projects', this.formatNumber(usageData.totals.projectCount)]);
        
        if (usageData.models.length > 0) {
            table.addRow(['Models Used', usageData.models.join(', ')]);
        }

        if (usageData.timeRange.start && usageData.timeRange.end) {
            const startStr = this.timezone.format(usageData.timeRange.start, {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
            const endStr = this.timezone.format(usageData.timeRange.end, {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
            table.addRow(['Time Range', `${startStr} - ${endStr}`]);
        }

        return table.toString();
    }

    /**
     * Get project details
     */
    async getProjectDetails(projectId, options = {}) {
        const spinner = new Spinner({ text: `Loading project ${projectId}...` });
        
        if (!options.quiet) {
            spinner.start();
        }

        try {
            const conversations = this.dataReader.getConversationData(projectId);
            
            if (!options.quiet) {
                spinner.succeed(`Project ${projectId} loaded`);
            }

            if (conversations.length === 0) {
                return {
                    project: projectId,
                    error: 'No conversations found for this project'
                };
            }

            const projectUsage = {
                totalTokens: 0,
                inputTokens: 0,
                outputTokens: 0,
                cacheCreationTokens: 0,
                cacheReadTokens: 0,
                requestCount: 0,
                conversations: []
            };

            for (const conversation of conversations) {
                const usageData = this.dataReader.extractUsageData(conversation.entries);
                
                projectUsage.totalTokens += usageData.totalTokens;
                projectUsage.inputTokens += usageData.inputTokens;
                projectUsage.outputTokens += usageData.outputTokens;
                projectUsage.cacheCreationTokens += usageData.cacheCreationTokens;
                projectUsage.cacheReadTokens += usageData.cacheReadTokens;
                projectUsage.requestCount += usageData.requestCount;

                projectUsage.conversations.push({
                    fileName: conversation.fileName,
                    modifiedTime: conversation.modifiedTime,
                    usage: usageData
                });
            }

            return {
                project: projectId,
                usage: projectUsage,
                formatted: this.createProjectTable(projectId, projectUsage, options)
            };

        } catch (error) {
            if (!options.quiet) {
                spinner.fail(`Error loading project ${projectId}: ${error.message}`);
            }
            throw error;
        }
    }

    /**
     * Create project details table
     */
    createProjectTable(projectId, usage, options = {}) {
        const table = new Table({ border: true });
        
        table.setHeaders(['Conversation', 'Tokens', 'Requests', 'Last Modified']);
        
        for (const conv of usage.conversations) {
            const lastModified = this.timezone.format(conv.modifiedTime, {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
            
            table.addRow([
                conv.fileName,
                this.formatNumber(conv.usage.totalTokens),
                this.formatNumber(conv.usage.requestCount),
                lastModified
            ]);
        }

        // Add totals row
        table.addRow([
            Colors.bright('TOTALS'),
            Colors.bright(this.formatNumber(usage.totalTokens)),
            Colors.bright(this.formatNumber(usage.requestCount)),
            '-'
        ]);

        return table.toString();
    }

    /**
     * List all projects
     */
    async listProjects(options = {}) {
        const spinner = new Spinner({ text: 'Loading projects...' });
        
        if (!options.quiet) {
            spinner.start();
        }

        try {
            const usageData = this.dataReader.getAllUsageData();
            
            if (!options.quiet) {
                spinner.succeed('Projects loaded');
            }

            return {
                projects: Object.keys(usageData.projects).map(projectId => ({
                    id: projectId,
                    usage: usageData.projects[projectId]
                })),
                formatted: this.createProjectsTable(usageData, options)
            };

        } catch (error) {
            if (!options.quiet) {
                spinner.fail(`Error loading projects: ${error.message}`);
            }
            throw error;
        }
    }

    /**
     * Create projects overview table
     */
    createProjectsTable(usageData, options = {}) {
        const table = new Table({ border: true });
        
        table.setHeaders(['Project', 'Total Tokens', 'Requests', 'Conversations', 'Models']);
        
        const projects = Object.entries(usageData.projects)
            .sort(([,a], [,b]) => b.totalTokens - a.totalTokens);

        for (const [projectId, usage] of projects) {
            if (usage.totalTokens === 0 && !options.includeEmpty) {
                continue;
            }

            table.addRow([
                projectId,
                this.formatNumber(usage.totalTokens),
                this.formatNumber(usage.requestCount),
                this.formatNumber(usage.conversationCount),
                usage.models.slice(0, 2).join(', ') + (usage.models.length > 2 ? '...' : '')
            ]);
        }

        return table.toString();
    }

    /**
     * Get usage by time period
     */
    async getUsageByPeriod(period = 'today', options = {}) {
        const spinner = new Spinner({ text: `Loading ${period} usage...` });
        
        if (!options.quiet) {
            spinner.start();
        }

        try {
            let dateRange;
            
            switch (period.toLowerCase()) {
                case 'today':
                    dateRange = DateRange.today(this.timezone.timezone);
                    break;
                case 'yesterday':
                    dateRange = DateRange.yesterday(this.timezone.timezone);
                    break;
                case 'week':
                    dateRange = DateRange.thisWeek(this.timezone.timezone);
                    break;
                case 'month':
                    dateRange = DateRange.thisMonth(this.timezone.timezone);
                    break;
                default:
                    throw new Error(`Unknown period: ${period}`);
            }

            const usageData = this.dataReader.filterByDateRange(
                this.dataReader.getAllUsageData(),
                dateRange.start,
                dateRange.end
            );

            if (!options.quiet) {
                spinner.succeed(`${period} usage loaded`);
            }

            return {
                period,
                dateRange: {
                    start: dateRange.start,
                    end: dateRange.end,
                    formatted: dateRange.toString()
                },
                usage: usageData,
                formatted: this.formatSummary(usageData, options).formatted
            };

        } catch (error) {
            if (!options.quiet) {
                spinner.fail(`Error loading ${period} usage: ${error.message}`);
            }
            throw error;
        }
    }

    /**
     * Format numbers with thousands separators
     */
    formatNumber(num) {
        if (typeof num !== 'number') {
            return '0';
        }
        return num.toLocaleString();
    }

    /**
     * Get cache statistics
     */
    getCacheStats() {
        return this.dataReader.getCacheStats();
    }

    /**
     * Clear cache
     */
    clearCache() {
        this.dataReader.clearCache();
    }
}

module.exports = {
    ClaudeUsageMonitor
};