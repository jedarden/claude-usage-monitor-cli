"""
Command-line interface for Claude Usage Monitor.

Provides argument parsing and main entry point.
"""

import argparse
import sys
from typing import Optional

from . import __version__
from .monitor import ClaudeMonitor, PlanConfig
from .utils.terminal import Terminal
from .utils.timezone import TimezoneHandler


def create_parser() -> argparse.ArgumentParser:
    """Create and configure argument parser."""
    parser = argparse.ArgumentParser(
        prog='claude-usage-cli',
        description='Monitor Claude AI token usage with zero dependencies',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog='''
Examples:
  claude-usage-cli                                  # Monitor with Pro plan
  claude-usage-cli --plan max5                      # Monitor with Max5 plan
  claude-usage-cli --plan max20 --timezone US/Eastern  # Custom timezone
  claude-usage-cli --once                           # Run once and exit
  claude-usage-cli --summary                        # Show summary only
  claude-usage-cli --info                           # Show configuration info

Available plans: pro, max5, max20, custom
Common timezones: UTC, US/Eastern, US/Pacific, Europe/London, Asia/Tokyo

For more timezone options, use --list-timezones
        '''
    )
    
    # Version
    parser.add_argument(
        '--version', '-v',
        action='version',
        version=f'%(prog)s {__version__}'
    )
    
    # Plan selection
    parser.add_argument(
        '--plan', '-p',
        choices=PlanConfig.list_plans(),
        default='pro',
        help='Claude plan type (default: pro)'
    )
    
    # Timezone
    parser.add_argument(
        '--timezone', '-t',
        help='Timezone for reset times (default: local timezone)'
    )
    
    # Reset hour
    parser.add_argument(
        '--reset-hour', '-r',
        type=int,
        default=9,
        help='Hour when limits reset (0-23, default: 9)'
    )
    
    # Refresh interval
    parser.add_argument(
        '--refresh', '-f',
        type=int,
        default=3,
        help='Refresh interval in seconds (default: 3)'
    )
    
    # Run modes
    parser.add_argument(
        '--once',
        action='store_true',
        help='Run once and exit (no continuous monitoring)'
    )
    
    parser.add_argument(
        '--summary',
        action='store_true',
        help='Show summary statistics only'
    )
    
    parser.add_argument(
        '--info',
        action='store_true',
        help='Show configuration information'
    )
    
    # Utility commands
    parser.add_argument(
        '--list-plans',
        action='store_true',
        help='List available plans'
    )
    
    parser.add_argument(
        '--list-timezones',
        action='store_true',
        help='List common timezone names'
    )
    
    parser.add_argument(
        '--debug-locations',
        action='store_true',
        help='Show all searched Claude data locations for debugging'
    )
    
    # Debug/verbose options
    parser.add_argument(
        '--verbose',
        action='store_true',
        help='Enable verbose output'
    )
    
    parser.add_argument(
        '--no-color',
        action='store_true',
        help='Disable colored output'
    )
    
    return parser


def validate_args(args) -> bool:
    """Validate command line arguments."""
    terminal = Terminal()
    
    # Validate reset hour
    if not 0 <= args.reset_hour <= 23:
        print(terminal.error("Reset hour must be between 0 and 23"))
        return False
    
    # Validate refresh interval
    if args.refresh < 1:
        print(terminal.error("Refresh interval must be at least 1 second"))
        return False
    
    # Validate timezone if provided
    if args.timezone:
        try:
            tz_handler = TimezoneHandler()
            tz_handler.get_timezone(args.timezone)
        except Exception as e:
            print(terminal.error(f"Invalid timezone '{args.timezone}': {e}"))
            print(terminal.info("Use --list-timezones to see available options"))
            return False
    
    return True


def show_plan_info():
    """Display information about available plans."""
    terminal = Terminal()
    
    print(terminal.bold("📋 Available Claude Plans"))
    print()
    
    for plan_name, config in PlanConfig.PLANS.items():
        print(f"{terminal.cyan(plan_name.upper())}:")
        print(f"  Name: {config['name']}")
        print(f"  5-hour limit: {config['limit_per_5h']} conversations")
        print(f"  Daily limit: {config['daily_limit']} conversations")
        print(f"  Description: {config['description']}")
        print()


def show_debug_locations():
    """Display debug information about Claude data search locations."""
    terminal = Terminal()
    
    print(terminal.bold("🔍 Claude Data Location Debug"))
    print()
    
    from .utils.claude_data import ClaudeDataReader
    data_reader = ClaudeDataReader()
    debug_info = data_reader.debug_search_locations()
    
    print(f"Home directory: {terminal.cyan(debug_info['home_directory'])}")
    print(f"Detected config dir: {terminal.cyan(debug_info['detected_config_dir'])}")
    print(f"Projects directory: {terminal.cyan(debug_info['projects_dir'])}")
    print()
    
    print(terminal.bold("📁 Searched Locations:"))
    print()
    
    found_any = False
    for i, location in enumerate(debug_info['searched_locations'], 1):
        status_color = terminal.green if location['projects_exists'] else terminal.red
        exists_symbol = "✓" if location['projects_exists'] else "✗"
        
        print(f"{i}. {status_color(exists_symbol)} {location['path']}")
        print(f"   Projects path: {location['projects_path']}")
        print(f"   Directory exists: {location['exists']}")
        print(f"   Projects exists: {location['projects_exists']}")
        
        if location['projects_exists']:
            print(f"   Has files: {location['has_files']}")
            print(f"   File count: {location['file_count']}")
            if location['has_files']:
                found_any = True
                print(f"   {terminal.green('✓ FOUND CLAUDE DATA HERE!')}")
        
        if 'permission_error' in location:
            print(f"   {terminal.warning('Permission denied accessing directory')}")
        
        print()
    
    if not found_any:
        print(terminal.warning("❌ No Claude data found in any searched location!"))
        print()
        print("Possible solutions:")
        print("1. Make sure Claude Desktop is installed and has been used")
        print("2. Check if Claude data is in a custom location")
        print("3. Run Claude Desktop at least once to create data files")
        print("4. Use --config-dir to specify a custom location")


def show_timezone_info():
    """Display information about available timezones."""
    terminal = Terminal()
    tz_handler = TimezoneHandler()
    
    print(terminal.bold("🌍 Common Timezone Names"))
    print()
    
    # Group timezones by region
    regions = {
        'UTC/GMT': [],
        'US': [],
        'Europe': [],
        'Asia': [],
        'Australia': [],
        'Other': []
    }
    
    for tz_name in tz_handler.list_common_timezones():
        if tz_name in ['UTC', 'GMT']:
            regions['UTC/GMT'].append(tz_name)
        elif tz_name.startswith('US/'):
            regions['US'].append(tz_name)
        elif tz_name.startswith('Europe/'):
            regions['Europe'].append(tz_name)
        elif tz_name.startswith('Asia/'):
            regions['Asia'].append(tz_name)
        elif tz_name.startswith('Australia/'):
            regions['Australia'].append(tz_name)
        else:
            regions['Other'].append(tz_name)
    
    for region, timezones in regions.items():
        if timezones:
            print(terminal.cyan(f"{region}:"))
            for tz in sorted(timezones):
                try:
                    info = tz_handler.get_timezone_info(tz)
                    offset = info['offset']
                    current_time = info['formatted_time']
                    print(f"  {tz:<20} {offset:<8} {current_time}")
                except Exception:
                    print(f"  {tz}")
            print()


def show_config_info(args):
    """Display configuration and system information."""
    terminal = Terminal()
    
    print(terminal.bold("⚙️  Claude Monitor Configuration"))
    print()
    
    # Plan information
    plan_config = PlanConfig.get_plan(args.plan)
    print(f"Plan: {terminal.cyan(plan_config['name'])}")
    print(f"5-hour limit: {plan_config['limit_per_5h']} conversations")
    print(f"Daily limit: {plan_config['daily_limit']} conversations")
    print()
    
    # Timezone information
    tz_handler = TimezoneHandler()
    tz_info = tz_handler.get_timezone_info(args.timezone)
    print(f"Timezone: {terminal.cyan(tz_info['name'])}")
    print(f"Current time: {tz_info['formatted_time']}")
    print(f"UTC offset: {tz_info['offset']}")
    print(f"DST active: {'Yes' if tz_info['dst_active'] else 'No'}")
    print()
    
    # Reset information
    next_reset = tz_handler.get_next_reset_time(args.reset_hour, args.timezone)
    time_until = tz_handler.time_until_reset(args.reset_hour, args.timezone)
    print(f"Reset hour: {args.reset_hour}:00")
    print(f"Next reset: {tz_handler.format_datetime(next_reset)}")
    print(f"Time until reset: {time_until}")
    print()
    
    # Claude data information
    from .utils.claude_data import ClaudeDataReader
    data_reader = ClaudeDataReader()
    config_info = data_reader.get_config_info()
    
    print(terminal.bold("📁 Claude Data"))
    print(f"Config directory: {config_info['config_dir']}")
    print(f"Config exists: {'Yes' if config_info['config_exists'] else 'No'}")
    print(f"Projects directory: {config_info['projects_dir']}")
    print(f"Projects exist: {'Yes' if config_info['projects_exists'] else 'No'}")
    print(f"Conversation files: {config_info['conversation_files']}")
    
    if not config_info['config_exists']:
        print()
        print(terminal.warning("Claude configuration not found!"))
        print("Make sure Claude Desktop is installed and has been used.")
    
    print()
    
    # Runtime settings
    print(terminal.bold("🔧 Runtime Settings"))
    print(f"Refresh interval: {args.refresh} seconds")
    print(f"Verbose mode: {'On' if args.verbose else 'Off'}")
    print(f"Color output: {'Off' if args.no_color else 'On'}")


def show_summary(args) -> bool:
    """Show usage summary and exit."""
    terminal = Terminal()
    
    try:
        monitor = ClaudeMonitor(
            plan=args.plan,
            timezone_name=args.timezone,
            reset_hour=args.reset_hour,
            refresh_interval=args.refresh
        )
        
        stats = monitor.get_summary_stats()
        
        if not stats['success']:
            print(terminal.error(f"Failed to get usage statistics: {stats['error']}"))
            return False
        
        print(terminal.bold("📊 Claude Usage Summary"))
        print()
        
        # Current window
        window_usage = stats['current_window_usage']
        window_limit = stats['current_window_limit']
        window_percent = (window_usage / window_limit * 100) if window_limit > 0 else 0
        
        print(f"Current 5-hour window: {window_usage}/{window_limit} ({window_percent:.1f}%)")
        
        # Daily usage
        daily_usage = stats['daily_usage']
        daily_limit = stats['daily_limit']
        daily_percent = (daily_usage / daily_limit * 100) if daily_limit > 0 else 0
        
        print(f"Daily usage: {daily_usage}/{daily_limit} ({daily_percent:.1f}%)")
        
        # Plan and reset info
        print(f"Plan: {stats['plan']}")
        
        # Format time until reset
        time_until = stats['time_until_reset']
        hours = int(time_until.total_seconds() // 3600)
        minutes = int((time_until.total_seconds() % 3600) // 60)
        print(f"Next reset: {hours}h {minutes}m")
        
        return True
        
    except Exception as e:
        print(terminal.error(f"Error getting summary: {e}"))
        return False


def main():
    """Main entry point for the CLI."""
    parser = create_parser()
    args = parser.parse_args()
    
    # Handle no-color option
    if args.no_color:
        import os
        os.environ['NO_COLOR'] = '1'
    
    terminal = Terminal()
    
    # Handle utility commands first
    if args.list_plans:
        show_plan_info()
        return 0
    
    if args.list_timezones:
        show_timezone_info()
        return 0
    
    if args.debug_locations:
        show_debug_locations()
        return 0
    
    if args.info:
        show_config_info(args)
        return 0
    
    # Validate arguments
    if not validate_args(args):
        return 1
    
    # Handle summary mode
    if args.summary:
        success = show_summary(args)
        return 0 if success else 1
    
    # Create monitor instance
    try:
        monitor = ClaudeMonitor(
            plan=args.plan,
            timezone_name=args.timezone,
            reset_hour=args.reset_hour,
            refresh_interval=args.refresh
        )
    except Exception as e:
        print(terminal.error(f"Failed to initialize monitor: {e}"))
        return 1
    
    # Check Claude availability
    if not monitor.check_claude_availability():
        print(terminal.error("Claude configuration not found!"))
        print(f"Expected location: {monitor.data_reader.config_dir}")
        print()
        print(terminal.info("Make sure Claude Desktop is installed and has been used."))
        return 1
    
    # Run monitoring
    try:
        if args.once:
            success = monitor.run_once()
            return 0 if success else 1
        else:
            monitor.run()
            return 0
    except KeyboardInterrupt:
        print(f"\n{terminal.info('Monitoring stopped by user.')}")
        return 0
    except Exception as e:
        print(terminal.error(f"Monitoring error: {e}"))
        if args.verbose:
            import traceback
            traceback.print_exc()
        return 1


if __name__ == '__main__':
    sys.exit(main())