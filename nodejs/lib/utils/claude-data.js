/**
 * Claude data utilities - direct JSONL file reading
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

class ClaudeDataReader {
    constructor(options = {}) {
        this.baseDir = options.baseDir || this._getClaudeProjectsDir();
        this.cache = new Map();
        this.cacheTimeout = options.cacheTimeout || 5 * 60 * 1000; // 5 minutes
    }

    /**
     * Get Claude projects directory path
     * @private
     */
    _getClaudeProjectsDir() {
        const home = os.homedir();
        
        // Define primary and fallback locations based on platform
        let primaryDir, fallbackDir;
        
        if (process.platform === 'win32') {
            // On Windows, check AppData/claude first
            const appData = process.env.APPDATA || path.join(home, 'AppData', 'Roaming');
            primaryDir = path.join(appData, 'claude', 'projects');
            fallbackDir = path.join(home, 'claude', 'projects');
        } else {
            // On Unix-like systems, check ~/.claude first, then ~/.config/claude
            primaryDir = path.join(home, '.claude', 'projects');
            fallbackDir = path.join(home, '.config', 'claude', 'projects');
        }
        
        // Use primary location if it exists, otherwise fallback
        if (fs.existsSync(primaryDir)) {
            return primaryDir;
        } else if (fs.existsSync(fallbackDir)) {
            return fallbackDir;
        } else {
            // Return primary location as default (for new installations)
            return primaryDir;
        }
    }

    /**
     * Get all available projects
     */
    getProjects() {
        try {
            if (!fs.existsSync(this.baseDir)) {
                return [];
            }

            return fs.readdirSync(this.baseDir, { withFileTypes: true })
                .filter(dirent => dirent.isDirectory())
                .map(dirent => dirent.name)
                .sort();
        } catch (error) {
            console.error(`Error reading projects directory: ${error.message}`);
            return [];
        }
    }

    /**
     * Get conversation files for a project
     */
    getConversationFiles(projectId) {
        const projectDir = path.join(this.baseDir, projectId);
        
        if (!fs.existsSync(projectDir)) {
            return [];
        }

        try {
            return fs.readdirSync(projectDir)
                .filter(file => file.endsWith('.jsonl'))
                .map(file => path.join(projectDir, file))
                .sort();
        } catch (error) {
            console.error(`Error reading project directory ${projectId}: ${error.message}`);
            return [];
        }
    }

    /**
     * Read and parse a JSONL file
     */
    readJSONLFile(filePath) {
        const cacheKey = `${filePath}:${this.getFileModTime(filePath)}`;
        
        if (this.cache.has(cacheKey)) {
            const cached = this.cache.get(cacheKey);
            if (Date.now() - cached.timestamp < this.cacheTimeout) {
                return cached.data;
            }
        }

        try {
            const content = fs.readFileSync(filePath, 'utf8');
            const lines = content.trim().split('\n').filter(line => line.trim());
            const entries = [];

            for (const line of lines) {
                try {
                    const entry = JSON.parse(line);
                    entries.push(entry);
                } catch (parseError) {
                    console.warn(`Skipping invalid JSON line in ${filePath}: ${parseError.message}`);
                }
            }

            // Cache the result
            this.cache.set(cacheKey, {
                data: entries,
                timestamp: Date.now()
            });

            return entries;
        } catch (error) {
            console.error(`Error reading JSONL file ${filePath}: ${error.message}`);
            return [];
        }
    }

    /**
     * Get file modification time
     */
    getFileModTime(filePath) {
        try {
            const stats = fs.statSync(filePath);
            return stats.mtime.getTime();
        } catch (error) {
            return 0;
        }
    }

    /**
     * Get conversation data for a project
     */
    getConversationData(projectId) {
        const files = this.getConversationFiles(projectId);
        const conversations = [];

        for (const file of files) {
            const entries = this.readJSONLFile(file);
            
            if (entries.length > 0) {
                conversations.push({
                    file,
                    entries,
                    fileName: path.basename(file, '.jsonl'),
                    modifiedTime: new Date(this.getFileModTime(file))
                });
            }
        }

        return conversations.sort((a, b) => b.modifiedTime - a.modifiedTime);
    }

    /**
     * Get usage data from conversation entries
     */
    extractUsageData(entries) {
        const usageData = {
            totalTokens: 0,
            inputTokens: 0,
            outputTokens: 0,
            cacheCreationTokens: 0,
            cacheReadTokens: 0,
            requestCount: 0,
            conversations: [],
            models: new Set(),
            timeRange: { start: null, end: null }
        };

        for (const entry of entries) {
            if (entry.type === 'message' && entry.sender === 'assistant') {
                // Extract usage information from assistant messages
                const usage = this.extractMessageUsage(entry);
                if (usage) {
                    usageData.totalTokens += usage.totalTokens || 0;
                    usageData.inputTokens += usage.inputTokens || 0;
                    usageData.outputTokens += usage.outputTokens || 0;
                    usageData.cacheCreationTokens += usage.cacheCreationTokens || 0;
                    usageData.cacheReadTokens += usage.cacheReadTokens || 0;
                    usageData.requestCount++;

                    if (usage.model) {
                        usageData.models.add(usage.model);
                    }

                    // Update time range
                    const timestamp = new Date(entry.created_at || entry.timestamp);
                    if (!usageData.timeRange.start || timestamp < usageData.timeRange.start) {
                        usageData.timeRange.start = timestamp;
                    }
                    if (!usageData.timeRange.end || timestamp > usageData.timeRange.end) {
                        usageData.timeRange.end = timestamp;
                    }
                }
            }
        }

        usageData.models = Array.from(usageData.models);
        return usageData;
    }

    /**
     * Extract usage data from a single message
     */
    extractMessageUsage(message) {
        // Look for usage information in various possible locations
        const usage = message.usage || 
                     message.response?.usage || 
                     message.metadata?.usage ||
                     message.stats;

        if (!usage) {
            return null;
        }

        return {
            totalTokens: usage.total_tokens || usage.totalTokens || 0,
            inputTokens: usage.input_tokens || usage.inputTokens || usage.prompt_tokens || 0,
            outputTokens: usage.output_tokens || usage.outputTokens || usage.completion_tokens || 0,
            cacheCreationTokens: usage.cache_creation_input_tokens || usage.cacheCreationTokens || 0,
            cacheReadTokens: usage.cache_read_input_tokens || usage.cacheReadTokens || 0,
            model: message.model || message.response?.model || null,
            timestamp: new Date(message.created_at || message.timestamp)
        };
    }

    /**
     * Get usage summary for all projects
     */
    getAllUsageData(options = {}) {
        const projects = this.getProjects();
        const allUsage = {
            projects: {},
            totals: {
                totalTokens: 0,
                inputTokens: 0,
                outputTokens: 0,
                cacheCreationTokens: 0,
                cacheReadTokens: 0,
                requestCount: 0,
                projectCount: 0
            },
            models: new Set(),
            timeRange: { start: null, end: null }
        };

        for (const projectId of projects) {
            try {
                const conversations = this.getConversationData(projectId);
                const projectUsage = {
                    totalTokens: 0,
                    inputTokens: 0,
                    outputTokens: 0,
                    cacheCreationTokens: 0,
                    cacheReadTokens: 0,
                    requestCount: 0,
                    conversationCount: conversations.length,
                    models: new Set(),
                    timeRange: { start: null, end: null }
                };

                for (const conversation of conversations) {
                    const usageData = this.extractUsageData(conversation.entries);
                    
                    projectUsage.totalTokens += usageData.totalTokens;
                    projectUsage.inputTokens += usageData.inputTokens;
                    projectUsage.outputTokens += usageData.outputTokens;
                    projectUsage.cacheCreationTokens += usageData.cacheCreationTokens;
                    projectUsage.cacheReadTokens += usageData.cacheReadTokens;
                    projectUsage.requestCount += usageData.requestCount;

                    for (const model of usageData.models) {
                        projectUsage.models.add(model);
                        allUsage.models.add(model);
                    }

                    // Update time ranges
                    if (usageData.timeRange.start) {
                        if (!projectUsage.timeRange.start || usageData.timeRange.start < projectUsage.timeRange.start) {
                            projectUsage.timeRange.start = usageData.timeRange.start;
                        }
                        if (!allUsage.timeRange.start || usageData.timeRange.start < allUsage.timeRange.start) {
                            allUsage.timeRange.start = usageData.timeRange.start;
                        }
                    }

                    if (usageData.timeRange.end) {
                        if (!projectUsage.timeRange.end || usageData.timeRange.end > projectUsage.timeRange.end) {
                            projectUsage.timeRange.end = usageData.timeRange.end;
                        }
                        if (!allUsage.timeRange.end || usageData.timeRange.end > allUsage.timeRange.end) {
                            allUsage.timeRange.end = usageData.timeRange.end;
                        }
                    }
                }

                projectUsage.models = Array.from(projectUsage.models);
                allUsage.projects[projectId] = projectUsage;

                // Add to totals
                allUsage.totals.totalTokens += projectUsage.totalTokens;
                allUsage.totals.inputTokens += projectUsage.inputTokens;
                allUsage.totals.outputTokens += projectUsage.outputTokens;
                allUsage.totals.cacheCreationTokens += projectUsage.cacheCreationTokens;
                allUsage.totals.cacheReadTokens += projectUsage.cacheReadTokens;
                allUsage.totals.requestCount += projectUsage.requestCount;
                
                if (projectUsage.totalTokens > 0) {
                    allUsage.totals.projectCount++;
                }

            } catch (error) {
                console.error(`Error processing project ${projectId}: ${error.message}`);
            }
        }

        allUsage.models = Array.from(allUsage.models);
        return allUsage;
    }

    /**
     * Filter usage data by date range
     */
    filterByDateRange(usageData, startDate, endDate) {
        // This would be implemented to filter the raw conversation entries
        // by date range before processing usage data
        // For now, return the original data
        return usageData;
    }

    /**
     * Clear cache
     */
    clearCache() {
        this.cache.clear();
    }

    /**
     * Get cache statistics
     */
    getCacheStats() {
        return {
            size: this.cache.size,
            timeout: this.cacheTimeout
        };
    }
}

module.exports = {
    ClaudeDataReader
};