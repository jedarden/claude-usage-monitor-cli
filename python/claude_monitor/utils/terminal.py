"""
Terminal utilities with ANSI colors and progress bars.

Zero external dependencies - uses only built-in terminal capabilities.
"""

import sys
import os
import shutil
from typing import Optional, Union


class Colors:
    """ANSI color codes for terminal output."""
    
    # Reset
    RESET = '\033[0m'
    
    # Regular colors
    BLACK = '\033[30m'
    RED = '\033[31m'
    GREEN = '\033[32m'
    YELLOW = '\033[33m'
    BLUE = '\033[34m'
    MAGENTA = '\033[35m'
    CYAN = '\033[36m'
    WHITE = '\033[37m'
    
    # Bright colors
    BRIGHT_BLACK = '\033[90m'
    BRIGHT_RED = '\033[91m'
    BRIGHT_GREEN = '\033[92m'
    BRIGHT_YELLOW = '\033[93m'
    BRIGHT_BLUE = '\033[94m'
    BRIGHT_MAGENTA = '\033[95m'
    BRIGHT_CYAN = '\033[96m'
    BRIGHT_WHITE = '\033[97m'
    
    # Background colors
    BG_BLACK = '\033[40m'
    BG_RED = '\033[41m'
    BG_GREEN = '\033[42m'
    BG_YELLOW = '\033[43m'
    BG_BLUE = '\033[44m'
    BG_MAGENTA = '\033[45m'
    BG_CYAN = '\033[46m'
    BG_WHITE = '\033[47m'
    
    # Styles
    BOLD = '\033[1m'
    DIM = '\033[2m'
    UNDERLINE = '\033[4m'
    BLINK = '\033[5m'
    REVERSE = '\033[7m'
    STRIKETHROUGH = '\033[9m'


class Terminal:
    """Terminal utilities for colored output and formatting."""
    
    def __init__(self):
        self.colors_enabled = self._supports_color()
        self.width = self._get_terminal_width()
    
    def _supports_color(self) -> bool:
        """Check if terminal supports ANSI colors."""
        # Check if we're in a terminal
        if not sys.stdout.isatty():
            return False
        
        # Check environment variables
        if os.environ.get('NO_COLOR'):
            return False
        
        if os.environ.get('FORCE_COLOR'):
            return True
        
        # Check TERM environment variable
        term = os.environ.get('TERM', '').lower()
        if term in ['dumb', 'unknown']:
            return False
        
        # Windows Command Prompt support
        if os.name == 'nt':
            # Enable ANSI support on Windows 10+
            try:
                import ctypes
                kernel32 = ctypes.windll.kernel32
                kernel32.SetConsoleMode(kernel32.GetStdHandle(-11), 7)
                return True
            except Exception:
                return False
        
        return True
    
    def _get_terminal_width(self) -> int:
        """Get terminal width, default to 80 if unavailable."""
        try:
            return shutil.get_terminal_size().columns
        except Exception:
            return 80
    
    def colorize(self, text: str, color: str, style: Optional[str] = None) -> str:
        """Add color and style to text if colors are enabled."""
        if not self.colors_enabled:
            return text
        
        result = color + text
        if style:
            result = style + result
        result += Colors.RESET
        
        return result
    
    def red(self, text: str) -> str:
        """Red text."""
        return self.colorize(text, Colors.RED)
    
    def green(self, text: str) -> str:
        """Green text."""
        return self.colorize(text, Colors.GREEN)
    
    def yellow(self, text: str) -> str:
        """Yellow text."""
        return self.colorize(text, Colors.YELLOW)
    
    def blue(self, text: str) -> str:
        """Blue text."""
        return self.colorize(text, Colors.BLUE)
    
    def magenta(self, text: str) -> str:
        """Magenta text."""
        return self.colorize(text, Colors.MAGENTA)
    
    def cyan(self, text: str) -> str:
        """Cyan text."""
        return self.colorize(text, Colors.CYAN)
    
    def bright_green(self, text: str) -> str:
        """Bright green text."""
        return self.colorize(text, Colors.BRIGHT_GREEN)
    
    def bright_yellow(self, text: str) -> str:
        """Bright yellow text."""
        return self.colorize(text, Colors.BRIGHT_YELLOW)
    
    def bright_red(self, text: str) -> str:
        """Bright red text."""
        return self.colorize(text, Colors.BRIGHT_RED)
    
    def bright_blue(self, text: str) -> str:
        """Bright blue text."""
        return self.colorize(text, Colors.BRIGHT_BLUE)
    
    def bold(self, text: str) -> str:
        """Bold text."""
        return self.colorize(text, Colors.RESET, Colors.BOLD)
    
    def dim(self, text: str) -> str:
        """Dim text."""
        return self.colorize(text, Colors.RESET, Colors.DIM)
    
    def success(self, text: str) -> str:
        """Success message (green)."""
        return self.bright_green(f"✓ {text}")
    
    def warning(self, text: str) -> str:
        """Warning message (yellow)."""
        return self.bright_yellow(f"⚠ {text}")
    
    def error(self, text: str) -> str:
        """Error message (red)."""
        return self.bright_red(f"✗ {text}")
    
    def info(self, text: str) -> str:
        """Info message (blue)."""
        return self.bright_blue(f"ℹ {text}")
    
    def clear_line(self):
        """Clear the current line."""
        if self.colors_enabled:
            sys.stdout.write('\r\033[K')
            sys.stdout.flush()
    
    def move_cursor_up(self, lines: int = 1):
        """Move cursor up by specified lines."""
        if self.colors_enabled:
            sys.stdout.write(f'\033[{lines}A')
            sys.stdout.flush()
    
    def hide_cursor(self):
        """Hide the cursor."""
        if self.colors_enabled:
            sys.stdout.write('\033[?25l')
            sys.stdout.flush()
    
    def show_cursor(self):
        """Show the cursor."""
        if self.colors_enabled:
            sys.stdout.write('\033[?25h')
            sys.stdout.flush()


class ProgressBar:
    """Unicode-based progress bar with no external dependencies."""
    
    def __init__(self, total: int, width: int = 40, show_percentage: bool = True, 
                 show_count: bool = True, prefix: str = "", suffix: str = ""):
        self.total = total
        self.width = width
        self.show_percentage = show_percentage
        self.show_count = show_count
        self.prefix = prefix
        self.suffix = suffix
        self.current = 0
        self.terminal = Terminal()
        
        # Unicode progress bar characters
        self.fill_char = '█'
        self.empty_char = '░'
        self.partial_chars = ['', '▏', '▎', '▍', '▌', '▋', '▊', '▉']
    
    def update(self, current: int):
        """Update progress bar to current value."""
        self.current = min(current, self.total)
        self._draw()
    
    def increment(self, amount: int = 1):
        """Increment progress by amount."""
        self.update(self.current + amount)
    
    def _draw(self):
        """Draw the progress bar."""
        if self.total == 0:
            progress = 1.0
        else:
            progress = self.current / self.total
        
        # Calculate filled portion
        filled_width = progress * self.width
        filled_blocks = int(filled_width)
        partial_block = filled_width - filled_blocks
        
        # Build progress bar
        bar = self.fill_char * filled_blocks
        
        # Add partial block if needed
        if filled_blocks < self.width and partial_block > 0:
            partial_index = int(partial_block * len(self.partial_chars))
            if partial_index > 0:
                bar += self.partial_chars[partial_index]
                filled_blocks += 1
        
        # Fill remaining with empty characters
        bar += self.empty_char * (self.width - len(bar))
        
        # Build complete line
        parts = []
        
        if self.prefix:
            parts.append(self.prefix)
        
        # Color the progress bar
        if progress < 0.5:
            colored_bar = self.terminal.red(bar)
        elif progress < 0.8:
            colored_bar = self.terminal.yellow(bar)
        else:
            colored_bar = self.terminal.green(bar)
        
        parts.append(f"[{colored_bar}]")
        
        if self.show_percentage:
            parts.append(f"{progress * 100:5.1f}%")
        
        if self.show_count:
            parts.append(f"({self.current}/{self.total})")
        
        if self.suffix:
            parts.append(self.suffix)
        
        # Output the line
        line = " ".join(parts)
        self.terminal.clear_line()
        sys.stdout.write(f"\r{line}")
        sys.stdout.flush()
    
    def finish(self):
        """Complete the progress bar and move to next line."""
        self.update(self.total)
        sys.stdout.write("\n")
        sys.stdout.flush()


class Spinner:
    """Simple spinner animation."""
    
    def __init__(self, message: str = "Loading..."):
        self.message = message
        self.terminal = Terminal()
        self.frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏']
        self.current_frame = 0
    
    def update(self, message: Optional[str] = None):
        """Update spinner with optional new message."""
        if message:
            self.message = message
        
        frame = self.frames[self.current_frame]
        self.current_frame = (self.current_frame + 1) % len(self.frames)
        
        self.terminal.clear_line()
        colored_spinner = self.terminal.blue(frame)
        sys.stdout.write(f"\r{colored_spinner} {self.message}")
        sys.stdout.flush()
    
    def stop(self, final_message: Optional[str] = None):
        """Stop spinner and optionally show final message."""
        self.terminal.clear_line()
        if final_message:
            sys.stdout.write(f"\r{final_message}\n")
        else:
            sys.stdout.write("\r")
        sys.stdout.flush()


def format_bytes(bytes_count: int) -> str:
    """Format bytes into human-readable format."""
    for unit in ['B', 'KB', 'MB', 'GB', 'TB']:
        if bytes_count < 1024.0:
            return f"{bytes_count:.1f} {unit}"
        bytes_count /= 1024.0
    return f"{bytes_count:.1f} PB"


def format_number(num: Union[int, float]) -> str:
    """Format large numbers with thousand separators."""
    if isinstance(num, float):
        return f"{num:,.2f}"
    return f"{num:,}"


def truncate_text(text: str, max_length: int, suffix: str = "...") -> str:
    """Truncate text to maximum length with suffix."""
    if len(text) <= max_length:
        return text
    return text[:max_length - len(suffix)] + suffix


def center_text(text: str, width: int, fill_char: str = " ") -> str:
    """Center text within specified width."""
    return text.center(width, fill_char)


def create_table_row(columns: list, widths: list, separator: str = " | ") -> str:
    """Create a formatted table row."""
    formatted_cols = []
    for i, (col, width) in enumerate(zip(columns, widths)):
        col_str = str(col)
        if len(col_str) > width:
            col_str = truncate_text(col_str, width)
        formatted_cols.append(col_str.ljust(width))
    
    return separator.join(formatted_cols)


def create_horizontal_line(width: int, char: str = "-") -> str:
    """Create a horizontal line of specified width."""
    return char * width