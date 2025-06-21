"""
Timezone handling using built-in datetime module.

Replaces pytz with zero external dependencies.
"""

import time
from datetime import datetime, timezone, timedelta
from typing import Optional, Dict, Any


class TimezoneHandler:
    """Handle timezone operations using built-in datetime module."""
    
    # Common timezone offsets (in hours)
    COMMON_TIMEZONES = {
        'UTC': 0,
        'GMT': 0,
        
        # US Timezones
        'US/Eastern': -5,  # EST (UTC-5), EDT (UTC-4) 
        'US/Central': -6,  # CST (UTC-6), CDT (UTC-5)
        'US/Mountain': -7, # MST (UTC-7), MDT (UTC-6)
        'US/Pacific': -8,  # PST (UTC-8), PDT (UTC-7)
        'US/Alaska': -9,   # AKST (UTC-9), AKDT (UTC-8)
        'US/Hawaii': -10,  # HST (UTC-10)
        
        # European Timezones
        'Europe/London': 0,    # GMT (UTC+0), BST (UTC+1)
        'Europe/Paris': 1,     # CET (UTC+1), CEST (UTC+2)
        'Europe/Berlin': 1,    # CET (UTC+1), CEST (UTC+2)
        'Europe/Rome': 1,      # CET (UTC+1), CEST (UTC+2)
        'Europe/Madrid': 1,    # CET (UTC+1), CEST (UTC+2)
        'Europe/Amsterdam': 1, # CET (UTC+1), CEST (UTC+2)
        'Europe/Moscow': 3,    # MSK (UTC+3)
        
        # Asian Timezones
        'Asia/Tokyo': 9,       # JST (UTC+9)
        'Asia/Shanghai': 8,    # CST (UTC+8)
        'Asia/Hong_Kong': 8,   # HKT (UTC+8)
        'Asia/Singapore': 8,   # SGT (UTC+8)
        'Asia/Seoul': 9,       # KST (UTC+9)
        'Asia/Mumbai': 5.5,    # IST (UTC+5:30)
        'Asia/Dubai': 4,       # GST (UTC+4)
        
        # Australian Timezones
        'Australia/Sydney': 10,    # AEST (UTC+10), AEDT (UTC+11)
        'Australia/Melbourne': 10, # AEST (UTC+10), AEDT (UTC+11)
        'Australia/Perth': 8,      # AWST (UTC+8)
        'Australia/Adelaide': 9.5, # ACST (UTC+9:30), ACDT (UTC+10:30)
        
        # Short forms
        'EST': -5, 'EDT': -4,
        'CST': -6, 'CDT': -5,
        'MST': -7, 'MDT': -6,
        'PST': -8, 'PDT': -7,
        'BST': 1,  'CET': 1, 'CEST': 2,
        'JST': 9,  'KST': 9,
        'IST': 5.5,
    }
    
    def __init__(self):
        self.local_timezone = self._get_local_timezone()
    
    def _get_local_timezone(self) -> timezone:
        """Get the local timezone as a timezone object."""
        # Get local timezone offset
        if time.daylight:
            # DST is in effect
            offset_seconds = -time.altzone
        else:
            # Standard time
            offset_seconds = -time.timezone
        
        offset_hours = offset_seconds / 3600
        return timezone(timedelta(hours=offset_hours))
    
    def get_timezone(self, tz_name: Optional[str] = None) -> timezone:
        """Get timezone object by name or return local timezone."""
        if not tz_name:
            return self.local_timezone
        
        # Handle UTC variations
        if tz_name.upper() in ['UTC', 'GMT', 'Z']:
            return timezone.utc
        
        # Look up in common timezones
        if tz_name in self.COMMON_TIMEZONES:
            offset = self.COMMON_TIMEZONES[tz_name]
            if isinstance(offset, float):
                hours = int(offset)
                minutes = int((offset - hours) * 60)
                return timezone(timedelta(hours=hours, minutes=minutes))
            else:
                return timezone(timedelta(hours=offset))
        
        # Try to parse offset format (e.g., +05:30, -08:00)
        if tz_name.startswith(('+', '-')):
            try:
                sign = 1 if tz_name[0] == '+' else -1
                parts = tz_name[1:].split(':')
                hours = int(parts[0])
                minutes = int(parts[1]) if len(parts) > 1 else 0
                total_minutes = sign * (hours * 60 + minutes)
                return timezone(timedelta(minutes=total_minutes))
            except (ValueError, IndexError):
                pass
        
        # Default to local timezone if can't parse
        return self.local_timezone
    
    def now(self, tz_name: Optional[str] = None) -> datetime:
        """Get current time in specified timezone."""
        tz = self.get_timezone(tz_name)
        return datetime.now(tz)
    
    def convert_to_timezone(self, dt: datetime, tz_name: str) -> datetime:
        """Convert datetime to specified timezone."""
        if dt.tzinfo is None:
            # Assume UTC if no timezone info
            dt = dt.replace(tzinfo=timezone.utc)
        
        target_tz = self.get_timezone(tz_name)
        return dt.astimezone(target_tz)
    
    def to_utc(self, dt: datetime) -> datetime:
        """Convert datetime to UTC."""
        if dt.tzinfo is None:
            # Assume local timezone if no timezone info
            dt = dt.replace(tzinfo=self.local_timezone)
        
        return dt.astimezone(timezone.utc)
    
    def to_local(self, dt: datetime) -> datetime:
        """Convert datetime to local timezone."""
        if dt.tzinfo is None:
            # Assume UTC if no timezone info
            dt = dt.replace(tzinfo=timezone.utc)
        
        return dt.astimezone(self.local_timezone)
    
    def format_datetime(self, dt: datetime, format_str: str = "%Y-%m-%d %H:%M:%S %Z") -> str:
        """Format datetime with timezone information."""
        return dt.strftime(format_str)
    
    def get_next_reset_time(self, reset_hour: int = 9, tz_name: Optional[str] = None) -> datetime:
        """Get the next reset time (e.g., for Claude's 5-hour billing cycles)."""
        tz = self.get_timezone(tz_name)
        now = datetime.now(tz)
        
        # Calculate next reset time
        reset_time = now.replace(hour=reset_hour, minute=0, second=0, microsecond=0)
        
        # If reset time has passed today, move to tomorrow
        if now >= reset_time:
            reset_time = reset_time + timedelta(days=1)
        
        return reset_time
    
    def time_until_reset(self, reset_hour: int = 9, tz_name: Optional[str] = None) -> timedelta:
        """Get time remaining until next reset."""
        next_reset = self.get_next_reset_time(reset_hour, tz_name)
        now = self.now(tz_name)
        return next_reset - now
    
    def get_billing_window_start(self, dt: Optional[datetime] = None, 
                                tz_name: Optional[str] = None, 
                                window_hours: int = 5) -> datetime:
        """Get the start of the current billing window."""
        if dt is None:
            dt = self.now(tz_name)
        else:
            dt = self.convert_to_timezone(dt, tz_name or 'UTC')
        
        # Calculate window start
        hours_since_midnight = dt.hour + (dt.minute / 60.0) + (dt.second / 3600.0)
        window_number = int(hours_since_midnight / window_hours)
        window_start_hour = window_number * window_hours
        
        window_start = dt.replace(
            hour=int(window_start_hour),
            minute=int((window_start_hour % 1) * 60),
            second=0,
            microsecond=0
        )
        
        return window_start
    
    def get_billing_windows_for_day(self, date: Optional[datetime] = None,
                                  tz_name: Optional[str] = None,
                                  window_hours: int = 5) -> list:
        """Get all billing windows for a given day."""
        if date is None:
            date = self.now(tz_name)
        else:
            date = self.convert_to_timezone(date, tz_name or 'UTC')
        
        # Start of day
        day_start = date.replace(hour=0, minute=0, second=0, microsecond=0)
        
        windows = []
        current_time = day_start
        
        while current_time.date() == date.date():
            window_end = current_time + timedelta(hours=window_hours)
            windows.append({
                'start': current_time,
                'end': window_end,
                'duration_hours': window_hours
            })
            current_time = window_end
        
        return windows
    
    def is_dst_active(self, dt: Optional[datetime] = None, tz_name: Optional[str] = None) -> bool:
        """Check if daylight saving time is currently active."""
        if dt is None:
            dt = self.now(tz_name)
        
        # Simple DST detection for common zones
        # This is approximation - real DST rules are complex
        if tz_name and tz_name.startswith('US/'):
            # US DST: Second Sunday in March to First Sunday in November
            year = dt.year
            march_second_sunday = self._get_nth_weekday(year, 3, 6, 2)  # 2nd Sunday in March
            november_first_sunday = self._get_nth_weekday(year, 11, 6, 1)  # 1st Sunday in November
            
            return march_second_sunday <= dt.date() < november_first_sunday
        
        elif tz_name and tz_name.startswith('Europe/'):
            # EU DST: Last Sunday in March to Last Sunday in October
            year = dt.year
            march_last_sunday = self._get_last_weekday(year, 3, 6)  # Last Sunday in March
            october_last_sunday = self._get_last_weekday(year, 10, 6)  # Last Sunday in October
            
            return march_last_sunday <= dt.date() < october_last_sunday
        
        # For other zones, use system DST detection
        return time.daylight and dt.astimezone().dst() != timedelta(0)
    
    def _get_nth_weekday(self, year: int, month: int, weekday: int, n: int) -> datetime:
        """Get the nth occurrence of a weekday in a month."""
        first_day = datetime(year, month, 1)
        first_weekday = first_day.weekday()
        
        # Calculate days to add to get to the first occurrence
        days_to_add = (weekday - first_weekday) % 7
        first_occurrence = first_day + timedelta(days=days_to_add)
        
        # Add weeks to get to the nth occurrence
        nth_occurrence = first_occurrence + timedelta(weeks=n-1)
        
        return nth_occurrence
    
    def _get_last_weekday(self, year: int, month: int, weekday: int) -> datetime:
        """Get the last occurrence of a weekday in a month."""
        # Start from the end of the month and work backwards
        if month == 12:
            next_month = datetime(year + 1, 1, 1)
        else:
            next_month = datetime(year, month + 1, 1)
        
        last_day = next_month - timedelta(days=1)
        
        # Find the last occurrence of the weekday
        days_back = (last_day.weekday() - weekday) % 7
        last_occurrence = last_day - timedelta(days=days_back)
        
        return last_occurrence
    
    def get_timezone_info(self, tz_name: Optional[str] = None) -> Dict[str, Any]:
        """Get information about a timezone."""
        tz = self.get_timezone(tz_name)
        now = datetime.now(tz)
        
        return {
            'name': tz_name or 'Local',
            'offset': str(tz.utcoffset(now)),
            'dst_active': self.is_dst_active(now, tz_name),
            'current_time': now,
            'formatted_time': self.format_datetime(now)
        }
    
    def list_common_timezones(self) -> list:
        """Get list of commonly used timezone names."""
        return sorted(self.COMMON_TIMEZONES.keys())