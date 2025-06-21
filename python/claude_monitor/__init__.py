"""
Claude Usage Monitor - Professional CLI tool for monitoring Claude AI token usage.

Zero dependencies, easy installation, complete monitoring solution.
"""

__version__ = "1.0.0"
__author__ = "Claude Usage Monitor"
__license__ = "MIT"

from .monitor import ClaudeMonitor
from .cli import main

__all__ = ["ClaudeMonitor", "main"]