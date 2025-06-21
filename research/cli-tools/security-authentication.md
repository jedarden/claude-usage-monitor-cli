# CLI Tools Security and Authentication Research

## Executive Summary

This document provides comprehensive security and authentication best practices for CLI tool deployment and usage, with specific focus on package signing, credential management, supply chain security, and secure data handling. The research draws from industry-leading CLI tools including AWS CLI, Google Cloud SDK, Azure CLI, and GitHub CLI.

## Table of Contents

1. [Package Signing and Verification](#package-signing-and-verification)
2. [Secure Credential Storage](#secure-credential-storage)
3. [API Key and Token Management](#api-key-and-token-management)
4. [Supply Chain Security](#supply-chain-security)
5. [Security Scanning in CI/CD](#security-scanning-in-cicd)
6. [Handling Sensitive Data](#handling-sensitive-data)
7. [Security Checklists](#security-checklists)

## Package Signing and Verification

### Python Package Signing

#### Using GPG Signatures with PyPI

```python
# setup.py configuration for signing
import setuptools
from setuptools.command.upload import upload
import subprocess

class SignedUpload(upload):
    def run(self):
        # Sign the distribution files
        for dist_file in self.distribution.dist_files:
            subprocess.run([
                'gpg', '--detach-sign', '--armor', 
                dist_file[2]
            ], check=True)
        super().run()

setuptools.setup(
    cmdclass={'upload': SignedUpload}
)
```

#### Using Sigstore for Python Packages

```bash
# Install sigstore
pip install sigstore

# Sign a package
python -m sigstore sign dist/package-1.0.0.tar.gz

# Verify a package
python -m sigstore verify dist/package-1.0.0.tar.gz
```

#### TUF (The Update Framework) Integration

```python
# pyproject.toml
[tool.tuf]
repository = "https://example.com/tuf-repo"
root-keys = ["key1.pub", "key2.pub"]

# In your CLI code
from tuf.client.updater import Updater

def verify_update():
    updater = Updater(
        metadata_dir="~/.myapp/tuf",
        metadata_base_url="https://example.com/tuf-repo/metadata",
        target_base_url="https://example.com/tuf-repo/targets"
    )
    updater.refresh()
    target_info = updater.get_targetinfo("myapp-latest.tar.gz")
    updater.download_target(target_info)
```

### Node.js Package Signing

#### npm Package Signatures

```json
// package.json
{
  "scripts": {
    "prepack": "npm pkg fix",
    "postpack": "npm-sign sign"
  },
  "publishConfig": {
    "provenance": true
  }
}
```

#### Using npm provenance

```bash
# Enable provenance when publishing
npm publish --provenance

# Verify package provenance
npm audit signatures
```

#### Custom signing implementation

```javascript
const crypto = require('crypto');
const fs = require('fs');

class PackageSigner {
  constructor(privateKeyPath) {
    this.privateKey = fs.readFileSync(privateKeyPath, 'utf8');
  }

  signPackage(packagePath) {
    const packageData = fs.readFileSync(packagePath);
    const sign = crypto.createSign('SHA256');
    sign.update(packageData);
    sign.end();
    
    const signature = sign.sign(this.privateKey, 'hex');
    fs.writeFileSync(`${packagePath}.sig`, signature);
    
    return signature;
  }

  static verifyPackage(packagePath, signaturePath, publicKeyPath) {
    const publicKey = fs.readFileSync(publicKeyPath, 'utf8');
    const packageData = fs.readFileSync(packagePath);
    const signature = fs.readFileSync(signaturePath, 'utf8');
    
    const verify = crypto.createVerify('SHA256');
    verify.update(packageData);
    verify.end();
    
    return verify.verify(publicKey, signature, 'hex');
  }
}
```

## Secure Credential Storage

### Keyring Integration

#### Python Keyring Implementation

```python
import keyring
import getpass
from cryptography.fernet import Fernet
import json
import os

class SecureCredentialManager:
    def __init__(self, app_name="claude-monitor"):
        self.app_name = app_name
        self.keyring_backend = self._setup_keyring()
        
    def _setup_keyring(self):
        """Configure keyring backend based on platform"""
        import platform
        
        if platform.system() == "Darwin":
            from keyring.backends import macOS
            return macOS.Keyring()
        elif platform.system() == "Windows":
            from keyring.backends import Windows
            return Windows.WinVaultKeyring()
        else:
            from keyring.backends import SecretService
            return SecretService.Keyring()
    
    def store_credential(self, service, username, password):
        """Store credential securely"""
        try:
            keyring.set_password(f"{self.app_name}:{service}", username, password)
            return True
        except keyring.errors.PasswordSetError:
            return False
    
    def retrieve_credential(self, service, username):
        """Retrieve credential securely"""
        try:
            return keyring.get_password(f"{self.app_name}:{service}", username)
        except keyring.errors.KeyringError:
            return None
    
    def delete_credential(self, service, username):
        """Delete stored credential"""
        try:
            keyring.delete_password(f"{self.app_name}:{service}", username)
            return True
        except keyring.errors.PasswordDeleteError:
            return False

class EncryptedFileCredentialStore:
    """Fallback for systems without keyring support"""
    
    def __init__(self, config_dir="~/.claude-monitor"):
        self.config_dir = os.path.expanduser(config_dir)
        os.makedirs(self.config_dir, mode=0o700, exist_ok=True)
        self.cred_file = os.path.join(self.config_dir, "credentials.enc")
        self.key_file = os.path.join(self.config_dir, ".key")
        self._ensure_encryption_key()
    
    def _ensure_encryption_key(self):
        """Generate or load encryption key"""
        if not os.path.exists(self.key_file):
            key = Fernet.generate_key()
            with open(self.key_file, 'wb') as f:
                f.write(key)
            os.chmod(self.key_file, 0o600)
        
        with open(self.key_file, 'rb') as f:
            self.cipher = Fernet(f.read())
    
    def store_credentials(self, credentials):
        """Store encrypted credentials"""
        data = json.dumps(credentials).encode()
        encrypted = self.cipher.encrypt(data)
        
        with open(self.cred_file, 'wb') as f:
            f.write(encrypted)
        os.chmod(self.cred_file, 0o600)
    
    def load_credentials(self):
        """Load and decrypt credentials"""
        if not os.path.exists(self.cred_file):
            return {}
        
        with open(self.cred_file, 'rb') as f:
            encrypted = f.read()
        
        decrypted = self.cipher.decrypt(encrypted)
        return json.loads(decrypted)
```

#### Node.js Keyring Implementation

```javascript
const keytar = require('keytar');
const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');
const os = require('os');

class SecureCredentialManager {
  constructor(appName = 'claude-monitor') {
    this.appName = appName;
  }

  async storeCredential(service, account, password) {
    try {
      await keytar.setPassword(`${this.appName}:${service}`, account, password);
      return true;
    } catch (error) {
      console.error('Failed to store credential:', error);
      return false;
    }
  }

  async retrieveCredential(service, account) {
    try {
      return await keytar.getPassword(`${this.appName}:${service}`, account);
    } catch (error) {
      console.error('Failed to retrieve credential:', error);
      return null;
    }
  }

  async deleteCredential(service, account) {
    try {
      return await keytar.deletePassword(`${this.appName}:${service}`, account);
    } catch (error) {
      console.error('Failed to delete credential:', error);
      return false;
    }
  }

  async findCredentials(service) {
    try {
      return await keytar.findCredentials(`${this.appName}:${service}`);
    } catch (error) {
      console.error('Failed to find credentials:', error);
      return [];
    }
  }
}

class EncryptedFileCredentialStore {
  constructor(configDir = path.join(os.homedir(), '.claude-monitor')) {
    this.configDir = configDir;
    this.credFile = path.join(configDir, 'credentials.enc');
    this.keyFile = path.join(configDir, '.key');
  }

  async init() {
    await fs.mkdir(this.configDir, { recursive: true, mode: 0o700 });
    await this._ensureEncryptionKey();
  }

  async _ensureEncryptionKey() {
    try {
      const key = await fs.readFile(this.keyFile);
      this.key = key;
    } catch (error) {
      // Generate new key
      this.key = crypto.randomBytes(32);
      await fs.writeFile(this.keyFile, this.key, { mode: 0o600 });
    }
  }

  async storeCredentials(credentials) {
    const data = JSON.stringify(credentials);
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-cbc', this.key, iv);
    
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const result = {
      iv: iv.toString('hex'),
      data: encrypted
    };
    
    await fs.writeFile(this.credFile, JSON.stringify(result), { mode: 0o600 });
  }

  async loadCredentials() {
    try {
      const content = await fs.readFile(this.credFile, 'utf8');
      const { iv, data } = JSON.parse(content);
      
      const decipher = crypto.createDecipheriv(
        'aes-256-cbc', 
        this.key, 
        Buffer.from(iv, 'hex')
      );
      
      let decrypted = decipher.update(data, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return JSON.parse(decrypted);
    } catch (error) {
      return {};
    }
  }
}
```

### Platform-Specific Credential Storage

#### AWS CLI Approach

```python
# AWS CLI style credential management
import configparser
import os
from pathlib import Path

class AWSStyleCredentialManager:
    def __init__(self):
        self.credentials_file = Path.home() / ".aws" / "credentials"
        self.config_file = Path.home() / ".aws" / "config"
    
    def configure(self, profile="default"):
        """Interactive configuration like 'aws configure'"""
        config = configparser.ConfigParser()
        credentials = configparser.ConfigParser()
        
        # Read existing configs
        if self.config_file.exists():
            config.read(self.config_file)
        if self.credentials_file.exists():
            credentials.read(self.credentials_file)
        
        # Interactive prompts
        access_key = getpass.getpass("API Access Key ID: ")
        secret_key = getpass.getpass("API Secret Access Key: ")
        region = input("Default region name [us-east-1]: ") or "us-east-1"
        output = input("Default output format [json]: ") or "json"
        
        # Update configurations
        if profile not in credentials:
            credentials[profile] = {}
        credentials[profile]["aws_access_key_id"] = access_key
        credentials[profile]["aws_secret_access_key"] = secret_key
        
        config_section = profile if profile == "default" else f"profile {profile}"
        if config_section not in config:
            config[config_section] = {}
        config[config_section]["region"] = region
        config[config_section]["output"] = output
        
        # Save with secure permissions
        os.makedirs(self.credentials_file.parent, mode=0o700, exist_ok=True)
        
        with open(self.credentials_file, 'w') as f:
            credentials.write(f)
        os.chmod(self.credentials_file, 0o600)
        
        with open(self.config_file, 'w') as f:
            config.write(f)
        os.chmod(self.config_file, 0o600)
```

#### GitHub CLI Approach

```python
# GitHub CLI style OAuth flow
import webbrowser
import http.server
import socketserver
import urllib.parse
import secrets
import hashlib
import base64

class GitHubStyleAuth:
    def __init__(self, client_id, auth_url="https://github.com/login/oauth/authorize"):
        self.client_id = client_id
        self.auth_url = auth_url
        self.redirect_port = 8080
    
    def authenticate(self):
        """OAuth device flow authentication"""
        # Generate PKCE challenge
        verifier = base64.urlsafe_b64encode(secrets.token_bytes(32)).decode('utf-8').rstrip('=')
        challenge = base64.urlsafe_b64encode(
            hashlib.sha256(verifier.encode('utf-8')).digest()
        ).decode('utf-8').rstrip('=')
        
        # Build authorization URL
        params = {
            'client_id': self.client_id,
            'redirect_uri': f'http://localhost:{self.redirect_port}/callback',
            'scope': 'read:user',
            'state': secrets.token_urlsafe(16),
            'code_challenge': challenge,
            'code_challenge_method': 'S256'
        }
        
        auth_url = f"{self.auth_url}?{urllib.parse.urlencode(params)}"
        
        # Start local server for callback
        code_receiver = CodeReceiver()
        with socketserver.TCPServer(("", self.redirect_port), 
                                   lambda *args: CodeHandler(code_receiver, *args)) as httpd:
            print(f"Opening browser for authentication...")
            webbrowser.open(auth_url)
            
            httpd.handle_request()
            
        return code_receiver.code, verifier

class CodeReceiver:
    def __init__(self):
        self.code = None

class CodeHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, code_receiver, *args):
        self.code_receiver = code_receiver
        super().__init__(*args)
    
    def do_GET(self):
        query = urllib.parse.urlparse(self.path).query
        params = urllib.parse.parse_qs(query)
        
        if 'code' in params:
            self.code_receiver.code = params['code'][0]
            self.send_response(200)
            self.send_header('Content-type', 'text/html')
            self.end_headers()
            self.wfile.write(b'<html><body><h1>Authentication successful!</h1>')
            self.wfile.write(b'<p>You can close this window.</p></body></html>')
        else:
            self.send_response(400)
            self.end_headers()
```

## API Key and Token Management

### Best Practices Implementation

```python
import os
import time
import jwt
import requests
from datetime import datetime, timedelta
from typing import Optional, Dict, Any

class APIKeyManager:
    def __init__(self, config_dir="~/.claude-monitor"):
        self.config_dir = os.path.expanduser(config_dir)
        self.cred_manager = SecureCredentialManager()
        self._token_cache = {}
    
    def validate_api_key(self, api_key: str) -> bool:
        """Validate API key format and structure"""
        # Example validation for Anthropic-style keys
        if not api_key or not isinstance(api_key, str):
            return False
        
        # Check prefix
        if not api_key.startswith("sk-ant-"):
            return False
        
        # Check length and character set
        if len(api_key) < 40 or not all(c.isalnum() or c == '-' for c in api_key):
            return False
        
        return True
    
    def rotate_api_key(self, old_key: str, new_key: str) -> bool:
        """Securely rotate API keys"""
        # Validate new key
        if not self.validate_api_key(new_key):
            raise ValueError("Invalid new API key format")
        
        # Test new key before rotation
        if not self._test_api_key(new_key):
            raise ValueError("New API key validation failed")
        
        # Store new key
        self.cred_manager.store_credential("api", "primary", new_key)
        
        # Keep old key as backup temporarily
        self.cred_manager.store_credential("api", "backup", old_key)
        
        return True
    
    def _test_api_key(self, api_key: str) -> bool:
        """Test API key with minimal request"""
        # Implementation depends on API
        # Example for hypothetical API:
        try:
            response = requests.get(
                "https://api.example.com/validate",
                headers={"Authorization": f"Bearer {api_key}"},
                timeout=5
            )
            return response.status_code == 200
        except:
            return False

class JWTTokenManager:
    """Manage JWT tokens with automatic refresh"""
    
    def __init__(self, issuer: str, audience: str):
        self.issuer = issuer
        self.audience = audience
        self.cred_manager = SecureCredentialManager()
    
    def create_token(self, user_id: str, expires_in: int = 3600) -> str:
        """Create a new JWT token"""
        private_key = self.cred_manager.retrieve_credential("jwt", "private_key")
        
        payload = {
            'iss': self.issuer,
            'sub': user_id,
            'aud': self.audience,
            'exp': datetime.utcnow() + timedelta(seconds=expires_in),
            'iat': datetime.utcnow(),
            'jti': secrets.token_urlsafe(16)
        }
        
        return jwt.encode(payload, private_key, algorithm='RS256')
    
    def verify_token(self, token: str) -> Optional[Dict[str, Any]]:
        """Verify and decode JWT token"""
        public_key = self.cred_manager.retrieve_credential("jwt", "public_key")
        
        try:
            payload = jwt.decode(
                token,
                public_key,
                algorithms=['RS256'],
                audience=self.audience,
                issuer=self.issuer
            )
            return payload
        except jwt.ExpiredSignatureError:
            return None
        except jwt.InvalidTokenError:
            return None
    
    def refresh_token(self, token: str) -> Optional[str]:
        """Refresh an expired token"""
        # Decode without verification to get user info
        unverified = jwt.decode(token, options={"verify_signature": False})
        
        # Verify refresh is allowed (within grace period)
        exp_timestamp = unverified.get('exp', 0)
        grace_period = 86400  # 24 hours
        
        if time.time() > exp_timestamp + grace_period:
            return None
        
        # Issue new token
        return self.create_token(unverified['sub'])

class EnvironmentVariableManager:
    """Secure environment variable handling"""
    
    @staticmethod
    def get_required_env(var_name: str) -> str:
        """Get required environment variable with validation"""
        value = os.environ.get(var_name)
        if not value:
            raise ValueError(f"Required environment variable {var_name} is not set")
        return value
    
    @staticmethod
    def get_env_with_fallback(var_name: str, fallback: str) -> str:
        """Get environment variable with fallback"""
        return os.environ.get(var_name, fallback)
    
    @staticmethod
    def validate_env_vars(required_vars: list) -> Dict[str, str]:
        """Validate all required environment variables"""
        env_vars = {}
        missing = []
        
        for var in required_vars:
            value = os.environ.get(var)
            if value:
                env_vars[var] = value
            else:
                missing.append(var)
        
        if missing:
            raise ValueError(f"Missing required environment variables: {', '.join(missing)}")
        
        return env_vars
    
    @staticmethod
    def mask_sensitive_value(value: str, visible_chars: int = 4) -> str:
        """Mask sensitive values for logging"""
        if len(value) <= visible_chars * 2:
            return "*" * len(value)
        
        return value[:visible_chars] + "*" * (len(value) - visible_chars * 2) + value[-visible_chars:]
```

### Environment Variable Best Practices

```bash
# .env.example - Template for environment variables
# Copy to .env and fill in your values

# API Configuration
CLAUDE_API_KEY=sk-ant-xxxxxxxxxxxx
CLAUDE_API_ENDPOINT=https://api.anthropic.com/v1

# Security Settings
API_KEY_ROTATION_DAYS=90
TOKEN_EXPIRY_SECONDS=3600
ENABLE_DEBUG_LOGGING=false

# Feature Flags
ENABLE_TELEMETRY=true
ENABLE_CRASH_REPORTING=true

# DO NOT COMMIT ACTUAL VALUES TO VERSION CONTROL
```

```python
# Environment loading with python-dotenv
from dotenv import load_dotenv
import os
from pathlib import Path

class EnvironmentConfig:
    def __init__(self):
        self._load_env_files()
        self._validate_environment()
    
    def _load_env_files(self):
        """Load environment files in order of precedence"""
        env = os.environ.get('CLAUDE_ENV', 'development')
        
        # Load files in order (later files override earlier ones)
        env_files = [
            '.env',                    # Default
            f'.env.{env}',            # Environment-specific
            '.env.local',             # Local overrides
            f'.env.{env}.local'       # Environment-specific local overrides
        ]
        
        for env_file in env_files:
            env_path = Path(env_file)
            if env_path.exists():
                load_dotenv(env_path, override=True)
    
    def _validate_environment(self):
        """Validate environment configuration"""
        required_vars = ['CLAUDE_API_KEY']
        
        for var in required_vars:
            if not os.environ.get(var):
                raise ValueError(f"Required environment variable {var} is not set")
        
        # Validate API key format
        api_key = os.environ.get('CLAUDE_API_KEY')
        if not api_key.startswith('sk-ant-'):
            raise ValueError("Invalid API key format")
```

## Supply Chain Security

### Dependency Vulnerability Scanning

#### Python Security Scanning Setup

```python
# pyproject.toml
[tool.poetry.dependencies]
python = "^3.8"
safety = "^2.3.0"
pip-audit = "^2.4.0"
bandit = "^1.7.0"

[tool.bandit]
exclude_dirs = ["tests", "venv"]
skips = ["B101"]  # Skip assert_used test

# Security check script
import subprocess
import sys
import json
from pathlib import Path

class SecurityScanner:
    def __init__(self, project_root="."):
        self.project_root = Path(project_root)
    
    def run_safety_check(self):
        """Run safety check on dependencies"""
        print("Running safety check...")
        result = subprocess.run(
            ["safety", "check", "--json"],
            capture_output=True,
            text=True
        )
        
        if result.returncode != 0:
            vulnerabilities = json.loads(result.stdout)
            self._report_vulnerabilities(vulnerabilities)
            return False
        
        print("✓ No known vulnerabilities found")
        return True
    
    def run_pip_audit(self):
        """Run pip-audit for vulnerability scanning"""
        print("Running pip-audit...")
        result = subprocess.run(
            ["pip-audit", "--format", "json"],
            capture_output=True,
            text=True
        )
        
        if result.returncode != 0:
            audit_results = json.loads(result.stdout)
            if audit_results:
                print("⚠️  Vulnerabilities found:")
                for vuln in audit_results:
                    print(f"  - {vuln['name']} {vuln['version']}: {vuln['description']}")
                return False
        
        print("✓ No vulnerabilities found by pip-audit")
        return True
    
    def run_bandit(self):
        """Run bandit for security issues in code"""
        print("Running bandit security scan...")
        result = subprocess.run(
            ["bandit", "-r", str(self.project_root), "-f", "json"],
            capture_output=True,
            text=True
        )
        
        results = json.loads(result.stdout)
        if results["results"]:
            print("⚠️  Security issues found:")
            for issue in results["results"]:
                print(f"  - {issue['test_name']} ({issue['severity']}): {issue['filename']}:{issue['line_number']}")
            return False
        
        print("✓ No security issues found by bandit")
        return True
    
    def generate_requirements_hash(self):
        """Generate hash of requirements for integrity checking"""
        import hashlib
        
        req_file = self.project_root / "requirements.txt"
        if req_file.exists():
            content = req_file.read_bytes()
            hash_value = hashlib.sha256(content).hexdigest()
            
            hash_file = self.project_root / "requirements.txt.sha256"
            hash_file.write_text(f"{hash_value}  requirements.txt\n")
            
            print(f"✓ Generated requirements hash: {hash_value[:16]}...")
            return hash_value
        
        return None
    
    def verify_requirements_hash(self):
        """Verify requirements file integrity"""
        import hashlib
        
        req_file = self.project_root / "requirements.txt"
        hash_file = self.project_root / "requirements.txt.sha256"
        
        if not hash_file.exists():
            print("⚠️  No hash file found for requirements.txt")
            return False
        
        stored_hash = hash_file.read_text().split()[0]
        
        if req_file.exists():
            content = req_file.read_bytes()
            current_hash = hashlib.sha256(content).hexdigest()
            
            if current_hash == stored_hash:
                print("✓ Requirements file integrity verified")
                return True
            else:
                print("⚠️  Requirements file has been modified!")
                return False
        
        return False
```

#### Node.js Security Scanning Setup

```javascript
// package.json security scripts
{
  "scripts": {
    "security:audit": "npm audit --production",
    "security:check": "npm run security:audit && npm run security:snyk",
    "security:snyk": "snyk test",
    "security:update": "npm update --save && npm audit fix",
    "security:lockfile": "npm install --package-lock-only"
  },
  "devDependencies": {
    "snyk": "^1.1000.0",
    "npm-audit-resolver": "^3.0.0",
    "better-npm-audit": "^3.7.0"
  }
}

// security-scanner.js
const { exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs').promises;
const crypto = require('crypto');
const path = require('path');

const execAsync = promisify(exec);

class SecurityScanner {
  constructor(projectRoot = '.') {
    this.projectRoot = projectRoot;
  }

  async runNpmAudit() {
    console.log('Running npm audit...');
    try {
      const { stdout } = await execAsync('npm audit --json', {
        cwd: this.projectRoot
      });
      
      const auditResult = JSON.parse(stdout);
      
      if (auditResult.metadata.vulnerabilities.total > 0) {
        console.log('⚠️  Vulnerabilities found:');
        console.log(`  Critical: ${auditResult.metadata.vulnerabilities.critical}`);
        console.log(`  High: ${auditResult.metadata.vulnerabilities.high}`);
        console.log(`  Moderate: ${auditResult.metadata.vulnerabilities.moderate}`);
        console.log(`  Low: ${auditResult.metadata.vulnerabilities.low}`);
        return false;
      }
      
      console.log('✓ No vulnerabilities found');
      return true;
    } catch (error) {
      console.error('Error running npm audit:', error.message);
      return false;
    }
  }

  async runSnykTest() {
    console.log('Running Snyk security test...');
    try {
      await execAsync('snyk test', { cwd: this.projectRoot });
      console.log('✓ Snyk test passed');
      return true;
    } catch (error) {
      console.error('⚠️  Snyk found vulnerabilities');
      return false;
    }
  }

  async generateLockfileHash() {
    const lockfilePath = path.join(this.projectRoot, 'package-lock.json');
    
    try {
      const content = await fs.readFile(lockfilePath);
      const hash = crypto.createHash('sha256').update(content).digest('hex');
      
      const hashFilePath = path.join(this.projectRoot, 'package-lock.json.sha256');
      await fs.writeFile(hashFilePath, `${hash}  package-lock.json\n`);
      
      console.log(`✓ Generated lockfile hash: ${hash.substring(0, 16)}...`);
      return hash;
    } catch (error) {
      console.error('Error generating lockfile hash:', error.message);
      return null;
    }
  }

  async verifyLockfileIntegrity() {
    const lockfilePath = path.join(this.projectRoot, 'package-lock.json');
    const hashFilePath = path.join(this.projectRoot, 'package-lock.json.sha256');
    
    try {
      const hashFileContent = await fs.readFile(hashFilePath, 'utf8');
      const storedHash = hashFileContent.split(' ')[0];
      
      const content = await fs.readFile(lockfilePath);
      const currentHash = crypto.createHash('sha256').update(content).digest('hex');
      
      if (currentHash === storedHash) {
        console.log('✓ Lockfile integrity verified');
        return true;
      } else {
        console.log('⚠️  Lockfile has been modified!');
        return false;
      }
    } catch (error) {
      console.error('Error verifying lockfile integrity:', error.message);
      return false;
    }
  }

  async checkDependencyLicenses() {
    console.log('Checking dependency licenses...');
    try {
      const { stdout } = await execAsync('license-checker --json', {
        cwd: this.projectRoot
      });
      
      const licenses = JSON.parse(stdout);
      const problematicLicenses = ['GPL', 'AGPL', 'LGPL'];
      const issues = [];
      
      for (const [pkg, info] of Object.entries(licenses)) {
        if (problematicLicenses.some(lic => info.licenses?.includes(lic))) {
          issues.push(`${pkg}: ${info.licenses}`);
        }
      }
      
      if (issues.length > 0) {
        console.log('⚠️  Packages with potentially problematic licenses:');
        issues.forEach(issue => console.log(`  - ${issue}`));
        return false;
      }
      
      console.log('✓ All dependency licenses are compatible');
      return true;
    } catch (error) {
      console.error('Error checking licenses:', error.message);
      return false;
    }
  }
}

module.exports = SecurityScanner;
```

### SBOM (Software Bill of Materials) Generation

#### Python SBOM Generation

```python
# SBOM generator using CycloneDX
import subprocess
import json
from datetime import datetime
from pathlib import Path

class SBOMGenerator:
    def __init__(self, project_root="."):
        self.project_root = Path(project_root)
    
    def generate_cyclonedx_sbom(self, format="json"):
        """Generate SBOM using CycloneDX"""
        print(f"Generating CycloneDX SBOM in {format} format...")
        
        output_file = self.project_root / f"sbom.{format}"
        
        # Install cyclonedx-bom if not present
        subprocess.run(["pip", "install", "cyclonedx-bom"], check=True)
        
        # Generate SBOM
        result = subprocess.run(
            ["cyclonedx-py", "-r", "-i", "requirements.txt", "-o", str(output_file), f"--format={format}"],
            cwd=self.project_root,
            capture_output=True,
            text=True
        )
        
        if result.returncode == 0:
            print(f"✓ SBOM generated: {output_file}")
            
            # Add metadata
            if format == "json":
                self._enhance_sbom_metadata(output_file)
            
            return True
        else:
            print(f"⚠️  Failed to generate SBOM: {result.stderr}")
            return False
    
    def _enhance_sbom_metadata(self, sbom_file):
        """Add additional metadata to SBOM"""
        with open(sbom_file, 'r') as f:
            sbom = json.load(f)
        
        # Add tool information
        sbom["metadata"]["tools"] = [
            {
                "vendor": "CycloneDX",
                "name": "cyclonedx-python",
                "version": "3.11.0"
            }
        ]
        
        # Add timestamp
        sbom["metadata"]["timestamp"] = datetime.utcnow().isoformat() + "Z"
        
        # Add component metadata
        sbom["metadata"]["component"] = {
            "type": "application",
            "bom-ref": "claude-usage-monitor",
            "name": "Claude Usage Monitor CLI",
            "version": "1.0.0"
        }
        
        with open(sbom_file, 'w') as f:
            json.dump(sbom, f, indent=2)
    
    def generate_spdx_sbom(self):
        """Generate SBOM in SPDX format"""
        print("Generating SPDX SBOM...")
        
        # Install spdx-tools if not present
        subprocess.run(["pip", "install", "spdx-tools"], check=True)
        
        output_file = self.project_root / "sbom.spdx"
        
        # Create SPDX document
        spdx_content = f"""SPDXVersion: SPDX-2.3
DataLicense: CC0-1.0
SPDXID: SPDXRef-DOCUMENT
DocumentName: Claude Usage Monitor CLI
DocumentNamespace: https://github.com/example/claude-usage-monitor
Creator: Tool: claude-monitor-sbom-generator
Created: {datetime.utcnow().isoformat()}Z

# Package Information
PackageName: claude-usage-monitor
SPDXID: SPDXRef-Package
PackageVersion: 1.0.0
PackageDownloadLocation: https://github.com/example/claude-usage-monitor
FilesAnalyzed: true
PackageVerificationCode: (excluded)
PackageLicenseConcluded: MIT
PackageLicenseDeclared: MIT
PackageCopyrightText: Copyright (c) 2024 Claude Monitor Contributors
"""
        
        output_file.write_text(spdx_content)
        print(f"✓ SPDX SBOM generated: {output_file}")
        return True
```

#### Node.js SBOM Generation

```javascript
// sbom-generator.js
const { exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs').promises;
const path = require('path');

const execAsync = promisify(exec);

class SBOMGenerator {
  constructor(projectRoot = '.') {
    this.projectRoot = projectRoot;
  }

  async generateCycloneDXSBOM(format = 'json') {
    console.log(`Generating CycloneDX SBOM in ${format} format...`);
    
    const outputFile = path.join(this.projectRoot, `sbom.${format}`);
    
    try {
      // Install @cyclonedx/bom if not present
      await execAsync('npm install -g @cyclonedx/bom');
      
      // Generate SBOM
      await execAsync(
        `cyclonedx-bom -o ${outputFile}`,
        { cwd: this.projectRoot }
      );
      
      console.log(`✓ SBOM generated: ${outputFile}`);
      
      if (format === 'json') {
        await this.enhanceSBOMMetadata(outputFile);
      }
      
      return true;
    } catch (error) {
      console.error(`⚠️  Failed to generate SBOM: ${error.message}`);
      return false;
    }
  }

  async enhanceSBOMMetadata(sbomFile) {
    try {
      const content = await fs.readFile(sbomFile, 'utf8');
      const sbom = JSON.parse(content);
      
      // Add metadata
      sbom.metadata = sbom.metadata || {};
      sbom.metadata.timestamp = new Date().toISOString();
      sbom.metadata.tools = [{
        vendor: 'CycloneDX',
        name: 'cyclonedx-node',
        version: '3.0.0'
      }];
      
      sbom.metadata.component = {
        type: 'application',
        'bom-ref': 'claude-usage-monitor',
        name: 'Claude Usage Monitor CLI',
        version: '1.0.0'
      };
      
      await fs.writeFile(sbomFile, JSON.stringify(sbom, null, 2));
    } catch (error) {
      console.error(`Error enhancing SBOM metadata: ${error.message}`);
    }
  }

  async verifySBOM(sbomFile) {
    console.log('Verifying SBOM...');
    
    try {
      const content = await fs.readFile(sbomFile, 'utf8');
      const sbom = JSON.parse(content);
      
      // Basic validation
      const required = ['bomFormat', 'specVersion', 'components'];
      const missing = required.filter(field => !sbom[field]);
      
      if (missing.length > 0) {
        console.log(`⚠️  SBOM missing required fields: ${missing.join(', ')}`);
        return false;
      }
      
      // Verify component count
      console.log(`✓ SBOM contains ${sbom.components.length} components`);
      
      // Check for vulnerable components
      const vulnerableComponents = sbom.components.filter(comp => 
        comp.evidence?.vulnerabilities?.length > 0
      );
      
      if (vulnerableComponents.length > 0) {
        console.log(`⚠️  Found ${vulnerableComponents.length} vulnerable components`);
        return false;
      }
      
      console.log('✓ SBOM verification passed');
      return true;
    } catch (error) {
      console.error(`Error verifying SBOM: ${error.message}`);
      return false;
    }
  }
}

module.exports = SBOMGenerator;
```

## Security Scanning in CI/CD

### GitHub Actions Security Pipeline

```yaml
# .github/workflows/security.yml
name: Security Scan

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]
  schedule:
    - cron: '0 0 * * 1'  # Weekly on Monday

jobs:
  python-security:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    
    - name: Set up Python
      uses: actions/setup-python@v4
      with:
        python-version: '3.10'
    
    - name: Install dependencies
      run: |
        pip install -r requirements.txt
        pip install safety bandit pip-audit
    
    - name: Run Safety check
      run: safety check --json > safety-report.json
      continue-on-error: true
    
    - name: Run Bandit
      run: bandit -r . -f json -o bandit-report.json
      continue-on-error: true
    
    - name: Run pip-audit
      run: pip-audit --format json > pip-audit-report.json
      continue-on-error: true
    
    - name: Upload security reports
      uses: actions/upload-artifact@v3
      with:
        name: security-reports-python
        path: |
          safety-report.json
          bandit-report.json
          pip-audit-report.json
    
    - name: Check for critical vulnerabilities
      run: |
        python -c "
        import json
        
        # Check Safety report
        with open('safety-report.json', 'r') as f:
            safety = json.load(f)
            if safety:
                print(f'Found {len(safety)} vulnerabilities')
                critical = [v for v in safety if v.get('severity', '').lower() == 'critical']
                if critical:
                    print('CRITICAL vulnerabilities found!')
                    exit(1)
        
        # Check Bandit report
        with open('bandit-report.json', 'r') as f:
            bandit = json.load(f)
            high_severity = [r for r in bandit['results'] if r['issue_severity'] == 'HIGH']
            if high_severity:
                print(f'Found {len(high_severity)} HIGH severity issues')
                exit(1)
        "

  nodejs-security:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run npm audit
      run: npm audit --json > npm-audit-report.json
      continue-on-error: true
    
    - name: Run Snyk test
      uses: snyk/actions/node@master
      env:
        SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
      continue-on-error: true
    
    - name: Run license check
      run: |
        npx license-checker --json > license-report.json
      continue-on-error: true
    
    - name: Upload security reports
      uses: actions/upload-artifact@v3
      with:
        name: security-reports-nodejs
        path: |
          npm-audit-report.json
          license-report.json
    
    - name: Check for high/critical vulnerabilities
      run: |
        node -e "
        const audit = require('./npm-audit-report.json');
        const high = audit.metadata.vulnerabilities.high;
        const critical = audit.metadata.vulnerabilities.critical;
        
        if (critical > 0) {
          console.error(\`Found \${critical} CRITICAL vulnerabilities!\`);
          process.exit(1);
        }
        
        if (high > 0) {
          console.warn(\`Found \${high} HIGH vulnerabilities\`);
        }
        "

  container-security:
    runs-on: ubuntu-latest
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'
    steps:
    - uses: actions/checkout@v3
    
    - name: Run Trivy vulnerability scanner
      uses: aquasecurity/trivy-action@master
      with:
        scan-type: 'fs'
        scan-ref: '.'
        format: 'sarif'
        output: 'trivy-results.sarif'
    
    - name: Upload Trivy scan results
      uses: github/codeql-action/upload-sarif@v2
      with:
        sarif_file: 'trivy-results.sarif'

  sbom-generation:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    
    - name: Generate SBOM for Python
      run: |
        pip install cyclonedx-bom
        cyclonedx-py -r -i requirements.txt -o sbom-python.json --format json
    
    - name: Generate SBOM for Node.js
      run: |
        npm install -g @cyclonedx/bom
        cd nodejs && cyclonedx-bom -o sbom-nodejs.json
    
    - name: Upload SBOMs
      uses: actions/upload-artifact@v3
      with:
        name: sbom-files
        path: |
          sbom-python.json
          sbom-nodejs.json
```

### GitLab CI Security Pipeline

```yaml
# .gitlab-ci.yml
stages:
  - build
  - test
  - security
  - deploy

variables:
  SECURE_LOG_LEVEL: "debug"

include:
  - template: Security/SAST.gitlab-ci.yml
  - template: Security/Dependency-Scanning.gitlab-ci.yml
  - template: Security/Secret-Detection.gitlab-ci.yml
  - template: Security/License-Scanning.gitlab-ci.yml

python-security:
  stage: security
  image: python:3.10
  script:
    - pip install safety bandit pip-audit
    - safety check --json > safety-report.json || true
    - bandit -r . -f json -o bandit-report.json || true
    - pip-audit --format json > pip-audit-report.json || true
  artifacts:
    reports:
      junit: "*-report.json"
    paths:
      - "*-report.json"
    expire_in: 1 week

nodejs-security:
  stage: security
  image: node:18
  script:
    - npm ci
    - npm audit --json > npm-audit-report.json || true
    - npx snyk test --json > snyk-report.json || true
    - npx license-checker --json > license-report.json || true
  artifacts:
    paths:
      - "*-report.json"
    expire_in: 1 week

container-scan:
  stage: security
  image: 
    name: aquasec/trivy:latest
    entrypoint: [""]
  script:
    - trivy fs --format json --output trivy-report.json .
  artifacts:
    paths:
      - trivy-report.json
    expire_in: 1 week

sbom-generation:
  stage: security
  parallel:
    matrix:
      - LANGUAGE: python
        IMAGE: python:3.10
        COMMAND: |
          pip install cyclonedx-bom
          cyclonedx-py -r -i requirements.txt -o sbom-python.json --format json
      - LANGUAGE: nodejs
        IMAGE: node:18
        COMMAND: |
          npm install -g @cyclonedx/bom
          cyclonedx-bom -o sbom-nodejs.json
  image: $IMAGE
  script:
    - eval $COMMAND
  artifacts:
    paths:
      - "sbom-*.json"
    expire_in: 1 month
```

## Handling Sensitive Data

### Secure Data Handling Implementation

```python
import os
import mmap
import ctypes
import platform
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from cryptography.hazmat.backends import default_backend
from cryptography.fernet import Fernet
import secrets

class SecureString:
    """Secure string implementation that zeros memory after use"""
    
    def __init__(self, value: str):
        self._value = value.encode('utf-8')
        self._length = len(self._value)
        
        # Allocate secure memory
        if platform.system() == "Windows":
            self._buffer = ctypes.create_string_buffer(self._length)
            ctypes.memmove(self._buffer, self._value, self._length)
        else:
            # Use mmap for Unix-like systems
            self._buffer = mmap.mmap(-1, self._length, mmap.MAP_PRIVATE | mmap.MAP_ANONYMOUS)
            self._buffer.write(self._value)
            self._buffer.seek(0)
    
    def get_value(self) -> str:
        """Get the string value"""
        if platform.system() == "Windows":
            return self._buffer.value.decode('utf-8')
        else:
            return self._buffer.read(self._length).decode('utf-8')
    
    def __del__(self):
        """Securely clear memory"""
        try:
            if platform.system() == "Windows":
                ctypes.memset(ctypes.addressof(self._buffer), 0, self._length)
            else:
                # Overwrite with random data first
                self._buffer.seek(0)
                self._buffer.write(os.urandom(self._length))
                self._buffer.close()
        except:
            pass

class SensitiveDataHandler:
    """Handle sensitive data with encryption and secure storage"""
    
    def __init__(self, master_password: str = None):
        if master_password:
            self.key = self._derive_key(master_password)
        else:
            self.key = Fernet.generate_key()
        
        self.cipher = Fernet(self.key)
        self._sensitive_fields = ['api_key', 'password', 'token', 'secret']
    
    def _derive_key(self, password: str) -> bytes:
        """Derive encryption key from password"""
        salt = b'claude-monitor-salt'  # In production, use random salt
        kdf = PBKDF2HMAC(
            algorithm=hashes.SHA256(),
            length=32,
            salt=salt,
            iterations=100000,
            backend=default_backend()
        )
        key = kdf.derive(password.encode())
        return base64.urlsafe_b64encode(key)
    
    def encrypt_data(self, data: dict) -> dict:
        """Encrypt sensitive fields in data"""
        encrypted_data = data.copy()
        
        for key, value in data.items():
            if any(field in key.lower() for field in self._sensitive_fields):
                if isinstance(value, str):
                    encrypted_data[key] = self.cipher.encrypt(value.encode()).decode()
                elif isinstance(value, dict):
                    encrypted_data[key] = self.encrypt_data(value)
        
        return encrypted_data
    
    def decrypt_data(self, data: dict) -> dict:
        """Decrypt sensitive fields in data"""
        decrypted_data = data.copy()
        
        for key, value in data.items():
            if any(field in key.lower() for field in self._sensitive_fields):
                if isinstance(value, str) and value:
                    try:
                        decrypted_data[key] = self.cipher.decrypt(value.encode()).decode()
                    except:
                        # If decryption fails, assume it's not encrypted
                        pass
                elif isinstance(value, dict):
                    decrypted_data[key] = self.decrypt_data(value)
        
        return decrypted_data
    
    def sanitize_for_logging(self, data: dict) -> dict:
        """Sanitize sensitive data for logging"""
        sanitized = data.copy()
        
        for key, value in data.items():
            if any(field in key.lower() for field in self._sensitive_fields):
                if isinstance(value, str) and value:
                    # Show first and last 4 characters
                    if len(value) > 8:
                        sanitized[key] = f"{value[:4]}...{value[-4:]}"
                    else:
                        sanitized[key] = "*" * len(value)
                elif isinstance(value, dict):
                    sanitized[key] = self.sanitize_for_logging(value)
        
        return sanitized

class MemorySecureConfig:
    """Configuration with memory protection"""
    
    def __init__(self):
        self._config = {}
        self._secure_values = {}
    
    def set_secure_value(self, key: str, value: str):
        """Store a secure value"""
        secure_str = SecureString(value)
        self._secure_values[key] = secure_str
    
    def get_secure_value(self, key: str) -> str:
        """Retrieve a secure value"""
        if key in self._secure_values:
            return self._secure_values[key].get_value()
        return None
    
    def clear_secure_values(self):
        """Clear all secure values"""
        self._secure_values.clear()

# Secure file operations
class SecureFileHandler:
    """Handle files with sensitive data securely"""
    
    @staticmethod
    def secure_delete(filepath: str):
        """Securely delete a file by overwriting it"""
        if not os.path.exists(filepath):
            return
        
        filesize = os.path.getsize(filepath)
        
        with open(filepath, "rb+") as f:
            # Overwrite with random data 3 times
            for _ in range(3):
                f.seek(0)
                f.write(os.urandom(filesize))
                f.flush()
                os.fsync(f.fileno())
        
        # Finally remove the file
        os.remove(filepath)
    
    @staticmethod
    def create_secure_temp_file() -> str:
        """Create a secure temporary file"""
        import tempfile
        
        # Create temp file with restricted permissions
        fd, filepath = tempfile.mkstemp()
        os.close(fd)
        
        # Set restrictive permissions (owner read/write only)
        os.chmod(filepath, 0o600)
        
        return filepath
```

### Secure Update Mechanisms

```python
import requests
import hashlib
import json
from datetime import datetime, timedelta
from typing import Optional, Tuple
import gnupg

class SecureUpdater:
    """Secure update mechanism for CLI tools"""
    
    def __init__(self, update_url: str, public_key_path: str):
        self.update_url = update_url
        self.gpg = gnupg.GPG()
        
        # Import public key for verification
        with open(public_key_path, 'r') as f:
            self.gpg.import_keys(f.read())
    
    def check_for_updates(self, current_version: str) -> Optional[dict]:
        """Check for available updates"""
        try:
            # Get update manifest
            response = requests.get(
                f"{self.update_url}/manifest.json",
                timeout=10,
                headers={'User-Agent': f'claude-monitor/{current_version}'}
            )
            response.raise_for_status()
            
            manifest = response.json()
            
            # Verify manifest signature
            sig_response = requests.get(
                f"{self.update_url}/manifest.json.sig",
                timeout=10
            )
            sig_response.raise_for_status()
            
            verified = self.gpg.verify_data(
                sig_response.content,
                response.content
            )
            
            if not verified:
                raise ValueError("Manifest signature verification failed")
            
            # Check version
            latest_version = manifest['version']
            if self._compare_versions(current_version, latest_version) < 0:
                return manifest
            
            return None
            
        except Exception as e:
            print(f"Update check failed: {e}")
            return None
    
    def download_update(self, update_info: dict) -> Tuple[str, bool]:
        """Download and verify update"""
        download_url = update_info['download_url']
        expected_hash = update_info['sha256']
        signature_url = update_info['signature_url']
        
        # Download update file
        response = requests.get(download_url, stream=True, timeout=30)
        response.raise_for_status()
        
        # Create secure temp file
        temp_file = SecureFileHandler.create_secure_temp_file()
        
        # Download with hash verification
        hasher = hashlib.sha256()
        
        with open(temp_file, 'wb') as f:
            for chunk in response.iter_content(chunk_size=8192):
                hasher.update(chunk)
                f.write(chunk)
        
        # Verify hash
        if hasher.hexdigest() != expected_hash:
            SecureFileHandler.secure_delete(temp_file)
            raise ValueError("Update file hash mismatch")
        
        # Download and verify signature
        sig_response = requests.get(signature_url, timeout=10)
        sig_response.raise_for_status()
        
        with open(temp_file, 'rb') as f:
            verified = self.gpg.verify_data(sig_response.content, f.read())
        
        if not verified:
            SecureFileHandler.secure_delete(temp_file)
            raise ValueError("Update signature verification failed")
        
        return temp_file, True
    
    def _compare_versions(self, v1: str, v2: str) -> int:
        """Compare semantic versions"""
        from packaging import version
        
        ver1 = version.parse(v1)
        ver2 = version.parse(v2)
        
        if ver1 < ver2:
            return -1
        elif ver1 > ver2:
            return 1
        else:
            return 0

class UpdateManifestGenerator:
    """Generate secure update manifests"""
    
    def __init__(self, private_key_path: str):
        self.gpg = gnupg.GPG()
        self.private_key = private_key_path
    
    def generate_manifest(self, version: str, file_path: str, download_base_url: str) -> dict:
        """Generate update manifest with signatures"""
        
        # Calculate file hash
        with open(file_path, 'rb') as f:
            file_hash = hashlib.sha256(f.read()).hexdigest()
        
        # Create manifest
        manifest = {
            'version': version,
            'release_date': datetime.utcnow().isoformat(),
            'download_url': f"{download_base_url}/{os.path.basename(file_path)}",
            'sha256': file_hash,
            'signature_url': f"{download_base_url}/{os.path.basename(file_path)}.sig",
            'changelog_url': f"{download_base_url}/CHANGELOG.md",
            'minimum_cli_version': '1.0.0'
        }
        
        # Sign the update file
        with open(file_path, 'rb') as f:
            signed = self.gpg.sign_file(f, keyid=self.private_key, detach=True)
        
        with open(f"{file_path}.sig", 'wb') as f:
            f.write(str(signed).encode())
        
        # Sign the manifest
        manifest_json = json.dumps(manifest, indent=2)
        signed_manifest = self.gpg.sign(manifest_json, keyid=self.private_key, detach=True)
        
        with open('manifest.json', 'w') as f:
            f.write(manifest_json)
        
        with open('manifest.json.sig', 'w') as f:
            f.write(str(signed_manifest))
        
        return manifest
```

## Security Checklists

### Pre-Release Security Checklist

```markdown
## Pre-Release Security Checklist

### Code Security
- [ ] Run static analysis tools (Bandit for Python, ESLint security plugin for Node.js)
- [ ] No hardcoded secrets or API keys in code
- [ ] All user inputs are validated and sanitized
- [ ] No use of dangerous functions (eval, exec, etc.)
- [ ] Proper error handling without exposing sensitive information
- [ ] Secure random number generation for tokens/secrets

### Dependencies
- [ ] All dependencies are up-to-date
- [ ] No known vulnerabilities in dependencies
- [ ] Dependencies are pinned to specific versions
- [ ] License compatibility verified
- [ ] SBOM generated and included

### Authentication & Authorization
- [ ] API keys are stored securely (keyring/encrypted)
- [ ] Tokens have appropriate expiration times
- [ ] Secure credential rotation mechanism in place
- [ ] No credentials in environment variables in production
- [ ] OAuth/JWT implementation follows best practices

### Data Protection
- [ ] Sensitive data is encrypted at rest
- [ ] Secure communication channels (HTTPS/TLS)
- [ ] Memory containing secrets is cleared after use
- [ ] Temporary files are securely deleted
- [ ] Logs don't contain sensitive information

### Package Security
- [ ] Package is signed with GPG/Sigstore
- [ ] Verification instructions included in documentation
- [ ] Update mechanism verifies signatures
- [ ] Package integrity can be verified (checksums)
- [ ] Build process is reproducible

### CI/CD Security
- [ ] Security scanning in CI pipeline
- [ ] Secrets are stored in secure vault
- [ ] Build artifacts are signed
- [ ] Deployment uses principle of least privilege
- [ ] Security tests are automated

### Documentation
- [ ] Security best practices documented
- [ ] Incident response plan in place
- [ ] Vulnerability disclosure policy published
- [ ] Update/patch process documented
- [ ] Security configuration guide available
```

### Runtime Security Checklist

```markdown
## Runtime Security Checklist

### Environment
- [ ] Running with minimal required privileges
- [ ] File permissions are restrictive (600/700)
- [ ] Configuration files are not world-readable
- [ ] Secure temporary directory is used
- [ ] No sensitive data in process environment

### Network Security
- [ ] TLS certificate validation enabled
- [ ] Certificate pinning for critical connections
- [ ] Timeout configured for all network requests
- [ ] Proxy settings respect system configuration
- [ ] DNS-over-HTTPS where applicable

### Input Validation
- [ ] Command-line arguments are validated
- [ ] File paths are sanitized and validated
- [ ] JSON/XML input is parsed safely
- [ ] Size limits enforced on all inputs
- [ ] Injection attacks prevented

### Logging & Monitoring
- [ ] Sensitive data is masked in logs
- [ ] Log rotation is configured
- [ ] Failed authentication attempts are logged
- [ ] Anomalous behavior is detected
- [ ] Audit trail maintained for sensitive operations

### Update Security
- [ ] Updates are downloaded over HTTPS
- [ ] Update signatures are verified
- [ ] Rollback mechanism available
- [ ] Update process doesn't bypass security
- [ ] User consent required for updates
```

### Incident Response Checklist

```markdown
## Security Incident Response Checklist

### Immediate Actions
- [ ] Isolate affected systems
- [ ] Preserve evidence (logs, memory dumps)
- [ ] Document timeline of events
- [ ] Notify security team
- [ ] Begin incident log

### Investigation
- [ ] Identify attack vector
- [ ] Determine scope of compromise
- [ ] Check for data exfiltration
- [ ] Review access logs
- [ ] Analyze malware/payloads

### Containment
- [ ] Revoke compromised credentials
- [ ] Block malicious IPs/domains
- [ ] Patch vulnerabilities
- [ ] Update security rules
- [ ] Implement additional monitoring

### Recovery
- [ ] Rebuild affected systems
- [ ] Restore from clean backups
- [ ] Reset all credentials
- [ ] Verify system integrity
- [ ] Test security controls

### Post-Incident
- [ ] Complete incident report
- [ ] Update security procedures
- [ ] Notify affected users
- [ ] Conduct lessons learned session
- [ ] Implement preventive measures

### Communication
- [ ] Prepare disclosure statement
- [ ] Notify relevant authorities
- [ ] Update security advisory
- [ ] Communicate with users
- [ ] Publish post-mortem (if appropriate)
```

## Conclusion

This comprehensive security guide provides actionable practices for securing CLI tools throughout their lifecycle. Key takeaways:

1. **Defense in Depth**: Implement multiple layers of security
2. **Secure by Default**: Make secure options the default choice
3. **Continuous Monitoring**: Regular security scans and updates
4. **User Trust**: Transparent security practices and communication
5. **Incident Preparedness**: Have a plan before you need it

Remember that security is an ongoing process, not a one-time implementation. Regular reviews and updates of these practices are essential to maintain a secure CLI tool.