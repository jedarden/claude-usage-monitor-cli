"""
Claude Data Reader - Direct access to Claude's JSONL files.

Replaces ccusage functionality with zero external dependencies.
Reads conversation logs directly from ~/.config/claude/projects/
"""

import json
import os
import glob
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional, Tuple


class ClaudeDataReader:
    """Reads and processes Claude conversation data from JSONL files."""
    
    def __init__(self):
        self.config_dir = self._get_claude_config_dir()
        self.projects_dir = os.path.join(self.config_dir, "projects")
        
    def _get_claude_config_dir(self) -> str:
        """Get Claude configuration directory path."""
        home = os.path.expanduser("~")
        
        # List of possible Claude config directories to check
        possible_dirs = []
        
        if os.name == 'nt':  # Windows
            possible_dirs = [
                os.path.join(os.environ.get('APPDATA', home), 'claude'),
                os.path.join(os.environ.get('LOCALAPPDATA', home), 'claude'),
                os.path.join(home, 'AppData', 'Roaming', 'claude'),
                os.path.join(home, 'AppData', 'Local', 'claude'),
                os.path.join(home, '.claude'),
                os.path.join(home, '.config', 'claude'),
            ]
        else:  # Unix-like systems (Linux, macOS)
            possible_dirs = [
                os.path.join(home, '.claude'),
                os.path.join(home, '.config', 'claude'),
                os.path.join(home, 'Library', 'Application Support', 'claude'),  # macOS
                os.path.join('/opt', 'claude'),
                os.path.join('/usr', 'local', 'share', 'claude'),
                os.path.join('/var', 'lib', 'claude'),
            ]
        
        # Check each possible directory for projects folder
        for dir_path in possible_dirs:
            projects_path = os.path.join(dir_path, 'projects')
            if os.path.exists(projects_path) and os.path.isdir(projects_path):
                # Check if there are any files in the projects directory
                if os.listdir(projects_path):
                    return dir_path
        
        # If no existing directory found, return the first option as default
        return possible_dirs[0] if possible_dirs else os.path.join(home, '.claude')
    
    def debug_search_locations(self) -> Dict[str, Any]:
        """Debug method to show all search locations and their status."""
        home = os.path.expanduser("~")
        search_results = {
            "home_directory": home,
            "detected_config_dir": self.config_dir,
            "projects_dir": self.projects_dir,
            "searched_locations": []
        }
        
        # Get the same possible directories as in _get_claude_config_dir
        if os.name == 'nt':  # Windows
            possible_dirs = [
                os.path.join(os.environ.get('APPDATA', home), 'claude'),
                os.path.join(os.environ.get('LOCALAPPDATA', home), 'claude'),
                os.path.join(home, 'AppData', 'Roaming', 'claude'),
                os.path.join(home, 'AppData', 'Local', 'claude'),
                os.path.join(home, '.claude'),
                os.path.join(home, '.config', 'claude'),
            ]
        else:  # Unix-like systems
            possible_dirs = [
                os.path.join(home, '.claude'),
                os.path.join(home, '.config', 'claude'),
                os.path.join(home, 'Library', 'Application Support', 'claude'),
                os.path.join('/opt', 'claude'),
                os.path.join('/usr', 'local', 'share', 'claude'),
                os.path.join('/var', 'lib', 'claude'),
            ]
        
        # Check each location
        for dir_path in possible_dirs:
            projects_path = os.path.join(dir_path, 'projects')
            status = {
                "path": dir_path,
                "projects_path": projects_path,
                "exists": os.path.exists(dir_path),
                "projects_exists": os.path.exists(projects_path),
                "has_files": False,
                "file_count": 0
            }
            
            if os.path.exists(projects_path) and os.path.isdir(projects_path):
                try:
                    files = os.listdir(projects_path)
                    status["has_files"] = len(files) > 0
                    status["file_count"] = len(files)
                except PermissionError:
                    status["permission_error"] = True
            
            search_results["searched_locations"].append(status)
        
        return search_results

    def find_conversation_files(self) -> List[str]:
        """Find all conversation JSONL files in Claude's data directory."""
        if not os.path.exists(self.projects_dir):
            return []
        
        files = []
        
        # Look for JSONL files directly in project directories (most common)
        pattern = os.path.join(self.projects_dir, "*", "*.jsonl")
        files.extend(glob.glob(pattern))
        
        # Also check for conversation subdirectories
        conv_pattern = os.path.join(self.projects_dir, "*", "conversations", "*.jsonl")
        files.extend(glob.glob(conv_pattern))
        
        # And direct conversation files
        direct_pattern = os.path.join(self.projects_dir, "conversations", "*.jsonl")
        files.extend(glob.glob(direct_pattern))
        
        # Remove duplicates and sort by modification time
        unique_files = list(set(files))
        return sorted(unique_files, key=os.path.getmtime, reverse=True)
    
    def read_conversation_file(self, file_path: str) -> List[Dict[str, Any]]:
        """Read and parse a JSONL conversation file."""
        conversations = []
        
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                for line_num, line in enumerate(f, 1):
                    line = line.strip()
                    if not line:
                        continue
                    
                    try:
                        data = json.loads(line)
                        conversations.append(data)
                    except json.JSONDecodeError as e:
                        # Skip malformed lines but continue processing
                        print(f"Warning: Skipping malformed JSON on line {line_num} in {file_path}: {e}")
                        continue
                        
        except (IOError, OSError) as e:
            print(f"Warning: Could not read file {file_path}: {e}")
            
        return conversations
    
    def extract_usage_data(self, conversation: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Extract usage data from a conversation entry."""
        # Look for usage information in various locations
        usage_data = {}
        
        # Check for message field with usage (most common in Claude logs)
        if 'message' in conversation and isinstance(conversation['message'], dict):
            message = conversation['message']
            if 'usage' in message and isinstance(message['usage'], dict):
                usage_data.update(message['usage'])
        
        # Check for direct usage field
        if 'usage' in conversation:
            usage_data.update(conversation['usage'])
        
        # Check for tokens in message content
        if 'messages' in conversation:
            for message in conversation['messages']:
                if isinstance(message, dict) and 'usage' in message:
                    # Accumulate usage from all messages
                    msg_usage = message['usage']
                    if isinstance(msg_usage, dict):
                        for key, value in msg_usage.items():
                            if isinstance(value, (int, float)):
                                usage_data[key] = usage_data.get(key, 0) + value
        
        # Check for claude-specific usage patterns
        if 'claude_usage' in conversation:
            usage_data.update(conversation['claude_usage'])
        
        # Check for token counts
        for field in ['input_tokens', 'output_tokens', 'total_tokens']:
            if field in conversation:
                usage_data[field] = conversation[field]
        
        # Extract timestamp
        timestamp = None
        for time_field in ['timestamp', 'created_at', 'updated_at', 'time']:
            if time_field in conversation:
                timestamp = conversation[time_field]
                break
        
        if timestamp:
            usage_data['timestamp'] = timestamp
            
        # Extract conversation ID if available
        for id_field in ['id', 'conversation_id', 'uuid', 'sessionId']:
            if id_field in conversation:
                usage_data['conversation_id'] = conversation[id_field]
                break
        
        # Calculate total tokens if not present
        if 'total_tokens' not in usage_data and ('input_tokens' in usage_data or 'output_tokens' in usage_data):
            input_tokens = usage_data.get('input_tokens', 0)
            output_tokens = usage_data.get('output_tokens', 0)
            cache_creation = usage_data.get('cache_creation_input_tokens', 0)
            cache_read = usage_data.get('cache_read_input_tokens', 0)
            usage_data['total_tokens'] = input_tokens + output_tokens + cache_creation + cache_read
        
        return usage_data if usage_data else None
    
    def parse_timestamp(self, timestamp: Any) -> Optional[datetime]:
        """Parse various timestamp formats to datetime object."""
        if not timestamp:
            return None
            
        try:
            # Handle different timestamp formats
            if isinstance(timestamp, (int, float)):
                # Unix timestamp (seconds or milliseconds)
                if timestamp > 1e12:  # Likely milliseconds
                    timestamp = timestamp / 1000
                return datetime.fromtimestamp(timestamp, tz=timezone.utc)
            
            elif isinstance(timestamp, str):
                # ISO format strings
                formats = [
                    "%Y-%m-%dT%H:%M:%S.%fZ",
                    "%Y-%m-%dT%H:%M:%SZ",
                    "%Y-%m-%dT%H:%M:%S.%f",
                    "%Y-%m-%dT%H:%M:%S",
                    "%Y-%m-%d %H:%M:%S.%f",
                    "%Y-%m-%d %H:%M:%S",
                ]
                
                for fmt in formats:
                    try:
                        dt = datetime.strptime(timestamp, fmt)
                        if dt.tzinfo is None:
                            dt = dt.replace(tzinfo=timezone.utc)
                        return dt
                    except ValueError:
                        continue
            
        except (ValueError, TypeError, OSError):
            pass
            
        return None
    
    def get_recent_usage(self, hours: int = 24) -> List[Dict[str, Any]]:
        """Get usage data from the last N hours."""
        cutoff_time = datetime.now(timezone.utc).timestamp() - (hours * 3600)
        usage_entries = []
        
        conversation_files = self.find_conversation_files()
        
        for file_path in conversation_files:
            conversations = self.read_conversation_file(file_path)
            
            for conversation in conversations:
                usage_data = self.extract_usage_data(conversation)
                if not usage_data:
                    continue
                
                # Parse and check timestamp
                timestamp = usage_data.get('timestamp')
                dt = self.parse_timestamp(timestamp)
                
                if dt and dt.timestamp() >= cutoff_time:
                    usage_data['parsed_timestamp'] = dt
                    usage_data['file_path'] = file_path
                    usage_entries.append(usage_data)
        
        # Sort by timestamp (newest first)
        usage_entries.sort(key=lambda x: x.get('parsed_timestamp', datetime.min.replace(tzinfo=timezone.utc)), reverse=True)
        
        return usage_entries
    
    def calculate_usage_summary(self, usage_entries: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Calculate summary statistics from usage entries."""
        if not usage_entries:
            return {
                'total_conversations': 0,
                'total_input_tokens': 0,
                'total_output_tokens': 0,
                'total_tokens': 0,
                'first_conversation': None,
                'last_conversation': None,
                'active_conversations': 0
            }
        
        total_input = 0
        total_output = 0
        total_tokens = 0
        conversation_ids = set()
        timestamps = []
        
        for entry in usage_entries:
            # Count tokens
            total_input += entry.get('input_tokens', 0)
            total_output += entry.get('output_tokens', 0)
            
            # Handle total tokens calculation
            if 'total_tokens' in entry:
                total_tokens += entry['total_tokens']
            else:
                # Calculate from input + output if total not available
                entry_total = entry.get('input_tokens', 0) + entry.get('output_tokens', 0)
                total_tokens += entry_total
            
            # Track unique conversations
            conv_id = entry.get('conversation_id')
            if conv_id:
                conversation_ids.add(conv_id)
            
            # Collect timestamps
            if 'parsed_timestamp' in entry:
                timestamps.append(entry['parsed_timestamp'])
        
        # Calculate time range
        timestamps.sort()
        first_conversation = timestamps[0] if timestamps else None
        last_conversation = timestamps[-1] if timestamps else None
        
        return {
            'total_conversations': len(conversation_ids),
            'total_input_tokens': total_input,
            'total_output_tokens': total_output,
            'total_tokens': total_tokens,
            'first_conversation': first_conversation,
            'last_conversation': last_conversation,
            'active_conversations': len(usage_entries),  # Total entries processed
            'usage_entries': usage_entries
        }
    
    def group_usage_by_time_blocks(self, usage_entries: List[Dict[str, Any]], block_hours: int = 5) -> List[Dict[str, Any]]:
        """Group usage data into time blocks (e.g., 5-hour blocks for Claude's billing)."""
        if not usage_entries:
            return []
        
        blocks = {}
        block_seconds = block_hours * 3600
        
        for entry in usage_entries:
            timestamp = entry.get('parsed_timestamp')
            if not timestamp:
                continue
            
            # Calculate block start time
            ts = timestamp.timestamp()
            block_start = (ts // block_seconds) * block_seconds
            block_key = int(block_start)
            
            if block_key not in blocks:
                blocks[block_key] = {
                    'block_start': datetime.fromtimestamp(block_start, tz=timezone.utc),
                    'block_end': datetime.fromtimestamp(block_start + block_seconds, tz=timezone.utc),
                    'total_input_tokens': 0,
                    'total_output_tokens': 0,
                    'total_tokens': 0,
                    'message_count': 0,
                    'conversation_count': 0,
                    'unique_conversations': set(),
                    'entries': []
                }
            
            block = blocks[block_key]
            block['total_input_tokens'] += entry.get('input_tokens', 0)
            block['total_output_tokens'] += entry.get('output_tokens', 0)
            block['total_tokens'] += entry.get('total_tokens', 0) or (entry.get('input_tokens', 0) + entry.get('output_tokens', 0))
            block['message_count'] += 1
            
            # Track unique conversations
            conv_id = entry.get('conversation_id')
            if conv_id:
                block['unique_conversations'].add(conv_id)
            
            block['entries'].append(entry)
        
        # Calculate conversation counts from unique conversations
        for block in blocks.values():
            block['conversation_count'] = len(block['unique_conversations'])
            # Remove the set before returning (not JSON serializable)
            del block['unique_conversations']
        
        # Convert to sorted list
        sorted_blocks = sorted(blocks.values(), key=lambda x: x['block_start'], reverse=True)
        return sorted_blocks
    
    def is_claude_available(self) -> bool:
        """Check if Claude configuration directory exists."""
        return os.path.exists(self.config_dir)
    
    def get_config_info(self) -> Dict[str, Any]:
        """Get information about Claude configuration."""
        return {
            'config_dir': self.config_dir,
            'projects_dir': self.projects_dir,
            'config_exists': os.path.exists(self.config_dir),
            'projects_exists': os.path.exists(self.projects_dir),
            'conversation_files': len(self.find_conversation_files())
        }