# Package Deployment Instructions

Both packages are built and ready for deployment!

## 📦 Built Packages

### Python Package
- **Location**: `python/dist/claude_usage_monitor-1.0.0.tar.gz`
- **Wheel**: `python/dist/claude_usage_monitor-1.0.0-py3-none-any.whl`

### Node.js Package  
- **Location**: `nodejs/claude-usage-cli-1.0.0.tgz`

## 🚀 Deployment Steps

### 1. PyPI Deployment (Python)

#### Create PyPI Account (if needed)
1. Go to https://pypi.org/account/register/
2. Create an account
3. Verify your email

#### Get API Token
1. Go to https://pypi.org/manage/account/
2. Scroll to "API tokens" section
3. Click "Add API token"
4. Name: "claude-usage-cli"
5. Scope: "Entire account" (for first upload)
6. Copy the token (starts with `pypi-`)

#### Deploy to PyPI
```bash
cd python
source build_env/bin/activate

# Upload to PyPI
twine upload dist/*

# You'll be prompted for:
# Username: __token__
# Password: [paste your API token here]
```

### 2. npm Deployment (Node.js)

#### Create npm Account (if needed)
1. Go to https://www.npmjs.com/signup
2. Create an account
3. Verify your email

#### Get Access Token
1. Login to npm:
   ```bash
   npm login
   ```
2. Generate token:
   ```bash
   npm token create
   ```
3. Copy the token

#### Deploy to npm
```bash
cd nodejs

# Publish to npm
npm publish

# Or if you prefer using the token directly:
npm publish --//registry.npmjs.org/:_authToken=YOUR_NPM_TOKEN
```

## 🔐 GitHub Actions Setup ✅

Your tokens are already configured in the Deploy environment! The GitHub Actions workflows will:

1. Run tests on every push and pull request
2. Automatically publish to PyPI and npm when:
   - Code is pushed to the main branch (CI workflow)
   - A new release is created (Publish workflow)
   - You manually trigger the workflow

The Deploy environment ensures secure access to your PyPI and npm tokens.

## ✅ Verification

After deployment, verify the packages:

### Python
```bash
pip install claude-usage-cli
claude-usage-cli --version
```

### Node.js
```bash
npm install -g claude-usage-cli
claude-usage-cli --version
```

## 📝 Post-Deployment

1. Create a GitHub release:
   ```bash
   git tag v1.0.0
   git push origin v1.0.0
   ```

2. The packages will be available at:
   - PyPI: https://pypi.org/project/claude-usage-cli/
   - npm: https://www.npmjs.com/package/claude-usage-cli

## ⚠️ Important Notes

- The package name `claude-usage-cli` must be available on both platforms
- If the name is taken, you'll need to update the package names in:
  - `python/pyproject.toml`
  - `nodejs/package.json`
- First deployment must be done manually, subsequent ones can use GitHub Actions