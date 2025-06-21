/**
 * Native argument parsing without external dependencies
 */

class ArgumentParser {
    constructor() {
        this.options = {};
        this.flags = new Set();
        this.commands = new Set();
        this.parsed = {};
    }

    addOption(name, config = {}) {
        this.options[name] = {
            alias: config.alias,
            type: config.type || 'string',
            default: config.default,
            description: config.description,
            required: config.required || false
        };
        return this;
    }

    addFlag(name, config = {}) {
        this.flags.add(name);
        this.options[name] = {
            alias: config.alias,
            type: 'boolean',
            default: false,
            description: config.description
        };
        return this;
    }

    addCommand(name) {
        this.commands.add(name);
        return this;
    }

    parse(argv = process.argv.slice(2)) {
        const result = {
            command: null,
            options: {},
            args: []
        };

        // Set defaults
        for (const [name, config] of Object.entries(this.options)) {
            if (config.default !== undefined) {
                result.options[name] = config.default;
            }
        }

        let i = 0;
        while (i < argv.length) {
            const arg = argv[i];

            if (arg.startsWith('--')) {
                // Long option
                const [name, value] = arg.slice(2).split('=', 2);
                const option = this.options[name];
                
                if (!option) {
                    throw new Error(`Unknown option: --${name}`);
                }

                if (option.type === 'boolean') {
                    result.options[name] = true;
                } else {
                    const optionValue = value !== undefined ? value : argv[++i];
                    if (optionValue === undefined) {
                        throw new Error(`Option --${name} requires a value`);
                    }
                    result.options[name] = this.convertValue(optionValue, option.type);
                }
            } else if (arg.startsWith('-') && arg.length > 1) {
                // Short option
                const shortName = arg.slice(1);
                const optionName = this.findOptionByAlias(shortName);
                
                if (!optionName) {
                    throw new Error(`Unknown option: -${shortName}`);
                }

                const option = this.options[optionName];
                if (option.type === 'boolean') {
                    result.options[optionName] = true;
                } else {
                    const value = argv[++i];
                    if (value === undefined) {
                        throw new Error(`Option -${shortName} requires a value`);
                    }
                    result.options[optionName] = this.convertValue(value, option.type);
                }
            } else {
                // Command or argument
                if (!result.command && this.commands.has(arg)) {
                    result.command = arg;
                } else {
                    result.args.push(arg);
                }
            }
            i++;
        }

        // Check required options
        for (const [name, config] of Object.entries(this.options)) {
            if (config.required && result.options[name] === undefined) {
                throw new Error(`Required option --${name} is missing`);
            }
        }

        this.parsed = result;
        return result;
    }

    findOptionByAlias(alias) {
        for (const [name, config] of Object.entries(this.options)) {
            if (config.alias === alias) {
                return name;
            }
        }
        return null;
    }

    convertValue(value, type) {
        switch (type) {
            case 'number':
                const num = Number(value);
                if (isNaN(num)) {
                    throw new Error(`Invalid number: ${value}`);
                }
                return num;
            case 'boolean':
                return value.toLowerCase() === 'true';
            default:
                return value;
        }
    }

    showHelp(programName = 'program') {
        console.log(`Usage: ${programName} [options] [command] [args...]`);
        console.log();

        if (this.commands.size > 0) {
            console.log('Commands:');
            for (const command of this.commands) {
                console.log(`  ${command}`);
            }
            console.log();
        }

        console.log('Options:');
        for (const [name, config] of Object.entries(this.options)) {
            const alias = config.alias ? `-${config.alias}, ` : '    ';
            const required = config.required ? ' (required)' : '';
            const defaultValue = config.default !== undefined ? ` (default: ${config.default})` : '';
            console.log(`  ${alias}--${name.padEnd(15)} ${config.description || ''}${required}${defaultValue}`);
        }
    }
}

module.exports = { ArgumentParser };