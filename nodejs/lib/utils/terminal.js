/**
 * Terminal utilities with ANSI colors and progress bars
 */

const ANSI = {
    // Colors
    RESET: '\x1b[0m',
    BRIGHT: '\x1b[1m',
    DIM: '\x1b[2m',
    UNDERSCORE: '\x1b[4m',
    BLINK: '\x1b[5m',
    REVERSE: '\x1b[7m',
    HIDDEN: '\x1b[8m',
    
    // Foreground colors
    BLACK: '\x1b[30m',
    RED: '\x1b[31m',
    GREEN: '\x1b[32m',
    YELLOW: '\x1b[33m',
    BLUE: '\x1b[34m',
    MAGENTA: '\x1b[35m',
    CYAN: '\x1b[36m',
    WHITE: '\x1b[37m',
    
    // Background colors
    BG_BLACK: '\x1b[40m',
    BG_RED: '\x1b[41m',
    BG_GREEN: '\x1b[42m',
    BG_YELLOW: '\x1b[43m',
    BG_BLUE: '\x1b[44m',
    BG_MAGENTA: '\x1b[45m',
    BG_CYAN: '\x1b[46m',
    BG_WHITE: '\x1b[47m',
};

class Colors {
    static isColorSupported() {
        return process.stdout.isTTY && process.env.TERM !== 'dumb';
    }

    static colorize(text, color) {
        if (!this.isColorSupported()) {
            return text;
        }
        return `${color}${text}${ANSI.RESET}`;
    }

    static red(text) { return this.colorize(text, ANSI.RED); }
    static green(text) { return this.colorize(text, ANSI.GREEN); }
    static yellow(text) { return this.colorize(text, ANSI.YELLOW); }
    static blue(text) { return this.colorize(text, ANSI.BLUE); }
    static magenta(text) { return this.colorize(text, ANSI.MAGENTA); }
    static cyan(text) { return this.colorize(text, ANSI.CYAN); }
    static white(text) { return this.colorize(text, ANSI.WHITE); }
    static bright(text) { return this.colorize(text, ANSI.BRIGHT); }
    static dim(text) { return this.colorize(text, ANSI.DIM); }
    static underscore(text) { return this.colorize(text, ANSI.UNDERSCORE); }
}

class ProgressBar {
    constructor(total, options = {}) {
        this.total = total;
        this.current = 0;
        this.width = options.width || 40;
        this.format = options.format || '{bar} {percentage}% {current}/{total}';
        this.completeChar = options.completeChar || '█';
        this.incompleteChar = options.incompleteChar || '░';
        this.stream = options.stream || process.stdout;
        this.isVisible = this.stream.isTTY;
    }

    update(current) {
        this.current = Math.min(current, this.total);
        if (this.isVisible) {
            this.render();
        }
    }

    increment(delta = 1) {
        this.update(this.current + delta);
    }

    render() {
        if (!this.isVisible) return;

        const percentage = Math.round((this.current / this.total) * 100);
        const completed = Math.round((this.current / this.total) * this.width);
        const incomplete = this.width - completed;

        const bar = this.completeChar.repeat(completed) + this.incompleteChar.repeat(incomplete);
        
        const output = this.format
            .replace('{bar}', bar)
            .replace('{percentage}', percentage.toString().padStart(3))
            .replace('{current}', this.current.toString())
            .replace('{total}', this.total.toString());

        this.stream.write(`\r${output}`);
    }

    complete() {
        this.update(this.total);
        if (this.isVisible) {
            this.stream.write('\n');
        }
    }
}

class Spinner {
    constructor(options = {}) {
        this.frames = options.frames || ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
        this.interval = options.interval || 80;
        this.stream = options.stream || process.stdout;
        this.text = options.text || '';
        this.frameIndex = 0;
        this.timer = null;
        this.isVisible = this.stream.isTTY;
    }

    start(text) {
        if (text) this.text = text;
        if (!this.isVisible) return this;

        this.timer = setInterval(() => {
            this.stream.write(`\r${this.frames[this.frameIndex]} ${this.text}`);
            this.frameIndex = (this.frameIndex + 1) % this.frames.length;
        }, this.interval);

        return this;
    }

    stop(finalText) {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }

        if (this.isVisible) {
            this.stream.write(`\r${finalText || this.text}\n`);
        }

        return this;
    }

    succeed(text) {
        return this.stop(`${Colors.green('✓')} ${text || this.text}`);
    }

    fail(text) {
        return this.stop(`${Colors.red('✗')} ${text || this.text}`);
    }

    warn(text) {
        return this.stop(`${Colors.yellow('⚠')} ${text || this.text}`);
    }

    info(text) {
        return this.stop(`${Colors.blue('ℹ')} ${text || this.text}`);
    }
}

class Table {
    constructor(options = {}) {
        this.headers = [];
        this.rows = [];
        this.columnWidths = [];
        this.padding = options.padding || 1;
        this.border = options.border !== false;
    }

    setHeaders(headers) {
        this.headers = headers;
        this.calculateColumnWidths();
        return this;
    }

    addRow(row) {
        this.rows.push(row);
        this.calculateColumnWidths();
        return this;
    }

    calculateColumnWidths() {
        this.columnWidths = [];
        
        // Initialize with header widths
        for (let i = 0; i < this.headers.length; i++) {
            this.columnWidths[i] = this.headers[i] ? this.headers[i].toString().length : 0;
        }

        // Update with row data widths
        for (const row of this.rows) {
            for (let i = 0; i < row.length; i++) {
                const cellWidth = row[i] ? row[i].toString().length : 0;
                this.columnWidths[i] = Math.max(this.columnWidths[i] || 0, cellWidth);
            }
        }
    }

    padCell(content, width) {
        const str = content ? content.toString() : '';
        return str.padEnd(width);
    }

    renderSeparator() {
        if (!this.border) return '';
        
        const parts = this.columnWidths.map(width => 
            '-'.repeat(width + this.padding * 2)
        );
        return `+${parts.join('+')}+\n`;
    }

    renderRow(row, isHeader = false) {
        const cells = row.map((cell, i) => {
            const content = this.padCell(cell, this.columnWidths[i]);
            const padding = ' '.repeat(this.padding);
            return `${padding}${content}${padding}`;
        });

        const separator = this.border ? '|' : ' ';
        const line = `${this.border ? '|' : ''}${cells.join(separator)}${this.border ? '|' : ''}\n`;
        
        if (isHeader && this.border) {
            return line + this.renderSeparator();
        }
        
        return line;
    }

    toString() {
        let output = '';
        
        if (this.border) {
            output += this.renderSeparator();
        }
        
        if (this.headers.length > 0) {
            output += this.renderRow(this.headers, true);
        }
        
        for (const row of this.rows) {
            output += this.renderRow(row);
        }
        
        if (this.border) {
            output += this.renderSeparator();
        }
        
        return output;
    }

    log() {
        console.log(this.toString());
        return this;
    }
}

module.exports = {
    ANSI,
    Colors,
    ProgressBar,
    Spinner,
    Table
};