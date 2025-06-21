/**
 * Timezone utilities using native Intl API
 */

class TimeZone {
    constructor(timezone = null) {
        this.timezone = timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;
    }

    /**
     * Format a date in the specified timezone
     */
    format(date, options = {}) {
        const defaultOptions = {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            timeZone: this.timezone,
            hour12: false
        };

        const formatOptions = { ...defaultOptions, ...options };
        
        try {
            const formatter = new Intl.DateTimeFormat('en-US', formatOptions);
            return formatter.format(date);
        } catch (error) {
            // Fallback to UTC if timezone is invalid
            formatOptions.timeZone = 'UTC';
            const formatter = new Intl.DateTimeFormat('en-US', formatOptions);
            return formatter.format(date);
        }
    }

    /**
     * Format date as ISO string in timezone
     */
    toISOString(date) {
        return this.format(date, {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            fractionalSecondDigits: 3
        }).replace(/(\d{2})\/(\d{2})\/(\d{4}), (\d{2}):(\d{2}):(\d{2})\.(\d{3})/, '$3-$1-$2T$4:$5:$6.$7');
    }

    /**
     * Get start and end of day in timezone
     */
    getDateBounds(date) {
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);
        
        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);
        
        return { start: startOfDay, end: endOfDay };
    }

    /**
     * Parse date string and convert to specified timezone
     */
    parseDate(dateString) {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) {
            throw new Error(`Invalid date string: ${dateString}`);
        }
        return date;
    }

    /**
     * Get relative time string (e.g., "2 hours ago", "in 3 days")
     */
    getRelativeTime(date, baseDate = new Date()) {
        const diffMs = date.getTime() - baseDate.getTime();
        const diffSec = Math.round(diffMs / 1000);
        const diffMin = Math.round(diffSec / 60);
        const diffHour = Math.round(diffMin / 60);
        const diffDay = Math.round(diffHour / 24);

        const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });

        if (Math.abs(diffSec) < 60) {
            return rtf.format(diffSec, 'second');
        } else if (Math.abs(diffMin) < 60) {
            return rtf.format(diffMin, 'minute');
        } else if (Math.abs(diffHour) < 24) {
            return rtf.format(diffHour, 'hour');
        } else {
            return rtf.format(diffDay, 'day');
        }
    }

    /**
     * Format duration in milliseconds to human readable string
     */
    formatDuration(milliseconds) {
        const seconds = Math.floor(milliseconds / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (days > 0) {
            return `${days}d ${hours % 24}h ${minutes % 60}m`;
        } else if (hours > 0) {
            return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
        } else if (minutes > 0) {
            return `${minutes}m ${seconds % 60}s`;
        } else {
            return `${seconds}s`;
        }
    }

    /**
     * Get timezone offset in minutes
     */
    getTimezoneOffset(date = new Date()) {
        return date.getTimezoneOffset();
    }

    /**
     * Check if timezone is valid
     */
    static isValidTimezone(timezone) {
        try {
            Intl.DateTimeFormat(undefined, { timeZone: timezone });
            return true;
        } catch (error) {
            return false;
        }
    }

    /**
     * Get list of supported timezones
     */
    static getSupportedTimezones() {
        return Intl.supportedValuesOf('timeZone');
    }

    /**
     * Get current timezone
     */
    static getCurrentTimezone() {
        return Intl.DateTimeFormat().resolvedOptions().timeZone;
    }

    /**
     * Convert date to different timezone
     */
    static convertTimezone(date, fromTimezone, toTimezone) {
        const fromTz = new TimeZone(fromTimezone);
        const toTz = new TimeZone(toTimezone);
        
        // This is a simplified conversion - for more complex scenarios,
        // you might need additional logic
        return new Date(date.getTime());
    }
}

/**
 * Date range utilities
 */
class DateRange {
    constructor(start, end, timezone = null) {
        this.start = start;
        this.end = end;
        this.tz = new TimeZone(timezone);
    }

    /**
     * Check if date is within range
     */
    contains(date) {
        return date >= this.start && date <= this.end;
    }

    /**
     * Get duration of range in milliseconds
     */
    getDuration() {
        return this.end.getTime() - this.start.getTime();
    }

    /**
     * Format range as string
     */
    toString(options = {}) {
        const startStr = this.tz.format(this.start, options);
        const endStr = this.tz.format(this.end, options);
        return `${startStr} - ${endStr}`;
    }

    /**
     * Create date range for today
     */
    static today(timezone = null) {
        const tz = new TimeZone(timezone);
        const now = new Date();
        const { start, end } = tz.getDateBounds(now);
        return new DateRange(start, end, timezone);
    }

    /**
     * Create date range for yesterday
     */
    static yesterday(timezone = null) {
        const tz = new TimeZone(timezone);
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        
        const { start, end } = tz.getDateBounds(yesterday);
        return new DateRange(start, end, timezone);
    }

    /**
     * Create date range for this week
     */
    static thisWeek(timezone = null) {
        const tz = new TimeZone(timezone);
        const now = new Date();
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay());
        startOfWeek.setHours(0, 0, 0, 0);
        
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        endOfWeek.setHours(23, 59, 59, 999);
        
        return new DateRange(startOfWeek, endOfWeek, timezone);
    }

    /**
     * Create date range for this month
     */
    static thisMonth(timezone = null) {
        const tz = new TimeZone(timezone);
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
        
        return new DateRange(startOfMonth, endOfMonth, timezone);
    }
}

module.exports = {
    TimeZone,
    DateRange
};