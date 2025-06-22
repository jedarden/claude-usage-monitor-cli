"""
Core monitoring logic for Claude usage tracking.

Provides real-time monitoring, predictions, and plan management.
"""

import time
import signal
import sys
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional, Tuple

from .utils.claude_data import ClaudeDataReader
from .utils.terminal import Terminal, ProgressBar, format_number, create_table_row
from .utils.timezone import TimezoneHandler


class PlanConfig:
    """Configuration for different Claude plans."""
    
    PLANS = {
        'pro': {
            'name': 'Claude Pro',
            'limit_per_5h': 1000,  # More realistic for API messages
            'daily_limit': 5000,
            'description': 'Claude Pro plan - High message limits'
        },
        'max5': {
            'name': 'Claude Max (5 messages)',
            'limit_per_5h': 5,
            'daily_limit': 30,
            'description': 'Claude Max plan - 5 messages per 5 hours'
        },
        'max20': {
            'name': 'Claude Max (20 messages)',
            'limit_per_5h': 20,
            'daily_limit': 100,
            'description': 'Claude Max plan - 20 messages per 5 hours'
        },
        'custom': {
            'name': 'Custom Plan',
            'limit_per_5h': 10,
            'daily_limit': 50,
            'description': 'Custom plan - configurable limits'
        }
    }
    
    @classmethod
    def get_plan(cls, plan_name: str) -> Dict[str, Any]:
        """Get plan configuration by name."""
        return cls.PLANS.get(plan_name.lower(), cls.PLANS['pro'])
    
    @classmethod
    def list_plans(cls) -> List[str]:
        """Get list of available plan names."""
        return list(cls.PLANS.keys())


class UsagePredictor:
    """Predict usage patterns based on historical data."""
    
    def __init__(self):
        self.terminal = Terminal()
    
    def predict_5h_usage(self, current_usage: int, time_elapsed_minutes: int, 
                        window_duration_minutes: int = 300) -> Dict[str, Any]:
        """Predict usage for the remainder of the 5-hour window."""
        if time_elapsed_minutes <= 0:
            return {
                'predicted_total': current_usage,
                'predicted_additional': 0,
                'burn_rate_per_hour': 0,
                'confidence': 'low'
            }
        
        # Calculate burn rate (messages per hour)
        burn_rate = (current_usage / time_elapsed_minutes) * 60
        
        # Time remaining in minutes
        time_remaining = window_duration_minutes - time_elapsed_minutes
        
        # Predict additional usage
        if time_remaining > 0:
            predicted_additional = (burn_rate * time_remaining) / 60
        else:
            predicted_additional = 0
        
        predicted_total = current_usage + predicted_additional
        
        # Determine confidence based on data available
        if time_elapsed_minutes < 30:
            confidence = 'low'
        elif time_elapsed_minutes < 120:
            confidence = 'medium'
        else:
            confidence = 'high'
        
        return {
            'predicted_total': round(predicted_total, 1),
            'predicted_additional': round(predicted_additional, 1),
            'burn_rate_per_hour': round(burn_rate, 2),
            'confidence': confidence,
            'time_remaining_minutes': max(0, time_remaining)
        }
    
    def predict_daily_usage(self, usage_blocks: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Predict daily usage based on current blocks."""
        if not usage_blocks:
            return {
                'predicted_total': 0,
                'current_total': 0,
                'blocks_remaining': 0,
                'average_per_block': 0
            }
        
        # Calculate current total conversations (not tokens)
        current_total = sum(block.get('conversation_count', 0) for block in usage_blocks)
        
        # Calculate average conversations per active block
        active_blocks = [b for b in usage_blocks if b.get('conversation_count', 0) > 0]
        if active_blocks:
            avg_per_block = sum(b.get('conversation_count', 0) for b in active_blocks) / len(active_blocks)
        else:
            avg_per_block = 0
        
        # Estimate remaining blocks in the day
        blocks_per_day = 24 // 5  # 5-hour blocks in a day
        blocks_used = len(usage_blocks)
        blocks_remaining = max(0, blocks_per_day - blocks_used)
        
        # Predict total daily usage
        predicted_additional = avg_per_block * blocks_remaining
        predicted_total = current_total + predicted_additional
        
        return {
            'predicted_total': round(predicted_total),
            'current_total': current_total,
            'blocks_remaining': blocks_remaining,
            'average_per_block': round(avg_per_block),
            'predicted_additional': round(predicted_additional)
        }


class ClaudeMonitor:
    """Main monitor class for Claude usage tracking."""
    
    def __init__(self, plan: str = 'pro', timezone_name: Optional[str] = None, 
                 reset_hour: int = 9, refresh_interval: int = 3):
        self.plan_config = PlanConfig.get_plan(plan)
        self.timezone_name = timezone_name
        self.reset_hour = reset_hour
        self.refresh_interval = refresh_interval
        
        # Initialize components
        self.data_reader = ClaudeDataReader()
        self.terminal = Terminal()
        self.timezone_handler = TimezoneHandler()
        self.predictor = UsagePredictor()
        
        # State
        self.running = False
        self.last_update = None
        
        # Setup signal handlers for graceful exit
        signal.signal(signal.SIGINT, self._signal_handler)
        signal.signal(signal.SIGTERM, self._signal_handler)
    
    def _signal_handler(self, signum, frame):
        """Handle interrupt signals gracefully."""
        self.running = False
        self.terminal.show_cursor()
        print(f"\n{self.terminal.info('Monitoring stopped.')}")
        sys.exit(0)
    
    def check_claude_availability(self) -> bool:
        """Check if Claude data is available."""
        return self.data_reader.is_claude_available()
    
    def get_current_usage(self) -> Dict[str, Any]:
        """Get current usage statistics."""
        # Get usage for the last 24 hours
        usage_entries = self.data_reader.get_recent_usage(hours=24)
        
        # Group into 5-hour blocks
        usage_blocks = self.data_reader.group_usage_by_time_blocks(usage_entries, block_hours=5)
        
        # Get current 5-hour window
        now = self.timezone_handler.now(self.timezone_name)
        current_window_start = self.timezone_handler.get_billing_window_start(
            now, self.timezone_name, window_hours=5
        )
        
        # Find current window usage
        current_window_usage = 0
        current_window_conversations = 0
        current_window_tokens = 0
        
        for block in usage_blocks:
            if block['block_start'] <= now < block['block_end']:
                # The limit is in conversations, not tokens
                current_window_usage = block['conversation_count']
                current_window_conversations = block['conversation_count']
                current_window_tokens = block['total_tokens']
                break
        
        # Calculate time elapsed in current window
        time_elapsed = now - current_window_start
        time_elapsed_minutes = int(time_elapsed.total_seconds() / 60)
        
        # Get predictions
        prediction = self.predictor.predict_5h_usage(
            current_window_conversations, time_elapsed_minutes
        )
        
        daily_prediction = self.predictor.predict_daily_usage(usage_blocks)
        
        # Calculate next reset time
        next_reset = self.timezone_handler.get_next_reset_time(
            self.reset_hour, self.timezone_name
        )
        time_until_reset = self.timezone_handler.time_until_reset(
            self.reset_hour, self.timezone_name
        )
        
        return {
            'current_window': {
                'start': current_window_start,
                'end': current_window_start + timedelta(hours=5),
                'usage': current_window_usage,
                'conversations': current_window_conversations,
                'time_elapsed_minutes': time_elapsed_minutes,
                'limit': self.plan_config['limit_per_5h']
            },
            'daily': {
                'total_usage': sum(block.get('conversation_count', 0) for block in usage_blocks),
                'total_conversations': sum(block.get('conversation_count', 0) for block in usage_blocks),
                'total_tokens': sum(block.get('total_tokens', 0) for block in usage_blocks),
                'limit': self.plan_config['daily_limit'],
                'blocks': usage_blocks
            },
            'predictions': {
                'window': prediction,
                'daily': daily_prediction
            },
            'reset': {
                'next_reset': next_reset,
                'time_until': time_until_reset
            },
            'plan': self.plan_config,
            'last_update': now,
            'timezone': self.timezone_handler.get_timezone_info(self.timezone_name)
        }
    
    def format_time_remaining(self, td: timedelta) -> str:
        """Format time remaining as human-readable string."""
        total_seconds = int(td.total_seconds())
        
        if total_seconds < 0:
            return "Expired"
        
        hours, remainder = divmod(total_seconds, 3600)
        minutes, seconds = divmod(remainder, 60)
        
        if hours > 0:
            return f"{hours}h {minutes}m"
        elif minutes > 0:
            return f"{minutes}m {seconds}s"
        else:
            return f"{seconds}s"
    
    def display_usage_summary(self, usage_data: Dict[str, Any]):
        """Display formatted usage summary."""
        current = usage_data['current_window']
        daily = usage_data['daily']
        predictions = usage_data['predictions']
        reset_info = usage_data['reset']
        plan = usage_data['plan']
        
        # Clear screen
        print("\033[2J\033[H", end="")
        
        # Header
        header = f"📊 Claude Usage Monitor - {plan['name']}"
        print(self.terminal.bold(self.terminal.cyan(header)))
        print(self.terminal.dim("=" * len(header)))
        
        # Current 5-hour window
        window_usage = current['conversations']
        window_limit = current['limit']
        window_percent = (window_usage / window_limit * 100) if window_limit > 0 else 0
        
        print(f"\n{self.terminal.bold('5-Hour Window')} ({self.timezone_handler.format_datetime(current['start'], '%H:%M')}-{self.timezone_handler.format_datetime(current['end'], '%H:%M')})")
        
        # Usage bar for current window
        bar_width = 30
        filled = int((window_usage / window_limit) * bar_width) if window_limit > 0 else 0
        bar = "█" * filled + "░" * (bar_width - filled)
        
        if window_percent < 50:
            colored_bar = self.terminal.green(bar)
        elif window_percent < 80:
            colored_bar = self.terminal.yellow(bar)
        else:
            colored_bar = self.terminal.red(bar)
        
        remaining_time = self.format_time_remaining(timedelta(minutes=300 - current['time_elapsed_minutes']))
        print(f"[{colored_bar}] {window_usage}/{window_limit} ({window_percent:.1f}%) • Resets in {remaining_time}")
        
        # Predictions for current window
        window_pred = predictions.get('window', {})
        if window_pred and window_pred.get('burn_rate_per_hour', 0) > 0:
            burn_rate = window_pred['burn_rate_per_hour']
            print(f"Burn rate: {burn_rate:.1f}/hr", end="")
            
            # Time to hit limit prediction
            if burn_rate > 0 and window_usage < window_limit:
                messages_remaining = window_limit - window_usage
                hours_to_limit = messages_remaining / burn_rate
                if hours_to_limit < 24:  # Only show if within 24 hours
                    if hours_to_limit < 1:
                        time_to_limit = f"{int(hours_to_limit * 60)}m"
                    else:
                        time_to_limit = f"{int(hours_to_limit)}h {int((hours_to_limit % 1) * 60)}m"
                    print(f" • Limit in {time_to_limit}")
            else:
                print()
        
        # Daily summary
        daily_usage = daily['total_conversations']
        daily_limit = daily['limit']
        daily_percent = (daily_usage / daily_limit * 100) if daily_limit > 0 else 0
        
        print(f"\n{self.terminal.bold('Daily Total')}")
        
        # Daily usage bar
        daily_filled = int((daily_usage / daily_limit) * bar_width) if daily_limit > 0 else 0
        daily_bar = "█" * daily_filled + "░" * (bar_width - daily_filled)
        
        if daily_percent < 50:
            colored_daily_bar = self.terminal.green(daily_bar)
        elif daily_percent < 80:
            colored_daily_bar = self.terminal.yellow(daily_bar)
        else:
            colored_daily_bar = self.terminal.red(daily_bar)
        
        print(f"[{colored_daily_bar}] {daily_usage}/{daily_limit} ({daily_percent:.1f}%)")
        
        # Daily reset info on same line
        next_reset_str = self.timezone_handler.format_datetime(reset_info['next_reset'], '%H:%M %Z')
        time_until_str = self.format_time_remaining(reset_info['time_until'])
        print(f"Resets at {next_reset_str} ({time_until_str})")
        
        # Recent activity - compact format
        if daily['blocks'] and len(daily['blocks']) > 1:
            print(f"\n{self.terminal.bold('Recent:')}", end=" ")
            recent_blocks = daily['blocks'][:3]
            block_strs = []
            for block in recent_blocks:
                time_str = self.timezone_handler.format_datetime(block['block_start'], '%H:%M')
                msgs = block['conversation_count']
                block_strs.append(f"{time_str}:{msgs}")
            print(" | ".join(block_strs))
        
        # Status
        print(f"\n{self.terminal.bold('Status:')}", end=" ")
        if window_percent > 90 or daily_percent > 90:
            print(self.terminal.red("⚠️  Limit approaching!"))
        elif window_percent > 75 or daily_percent > 75:
            print(self.terminal.yellow("Usage high"))
        else:
            print(self.terminal.green("✓ Normal"))
        
        # Footer
        last_update = self.timezone_handler.format_datetime(usage_data['last_update'], '%H:%M:%S')
        print(f"\n{self.terminal.dim(f'Updated: {last_update} • Ctrl+C to exit')}")
    
    def run_once(self) -> bool:
        """Run monitoring once and return success status."""
        try:
            if not self.check_claude_availability():
                print(self.terminal.error("Claude configuration not found!"))
                print(f"Expected location: {self.data_reader.config_dir}")
                return False
            
            usage_data = self.get_current_usage()
            self.display_usage_summary(usage_data)
            return True
            
        except Exception as e:
            print(self.terminal.error(f"Error monitoring usage: {e}"))
            return False
    
    def run(self):
        """Run continuous monitoring."""
        self.running = True
        self.terminal.hide_cursor()
        
        try:
            print(self.terminal.info(f"Starting Claude usage monitoring (Plan: {self.plan_config['name']})..."))
            time.sleep(1)
            
            while self.running:
                success = self.run_once()
                if not success:
                    break
                
                # Wait for next refresh
                for _ in range(self.refresh_interval):
                    if not self.running:
                        break
                    time.sleep(1)
                    
        except KeyboardInterrupt:
            pass
        finally:
            self.terminal.show_cursor()
            print(f"\n{self.terminal.info('Monitoring stopped.')}")
    
    def get_summary_stats(self) -> Dict[str, Any]:
        """Get summary statistics without full display."""
        try:
            usage_data = self.get_current_usage()
            return {
                'success': True,
                'current_window_usage': usage_data['current_window']['conversations'],
                'current_window_limit': usage_data['current_window']['limit'],
                'daily_usage': usage_data['daily']['total_conversations'],
                'daily_limit': usage_data['daily']['limit'],
                'plan': usage_data['plan']['name'],
                'next_reset': usage_data['reset']['next_reset'],
                'time_until_reset': usage_data['reset']['time_until']
            }
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }