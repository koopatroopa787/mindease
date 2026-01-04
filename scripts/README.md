# MindEase Scripts

Utility scripts for MindEase project management and automation.

## Available Scripts

### `create_issues.sh`

Batch create GitHub issues from the FUTURE_IMPROVEMENTS.md document.

**Prerequisites:**
```bash
# Install GitHub CLI
brew install gh  # macOS
# or download from https://cli.github.com

# Authenticate
gh auth login
```

**Usage:**

```bash
# Interactive mode (recommended)
./scripts/create_issues.sh

# Auto-create high-priority issues
./scripts/create_issues.sh --auto

# Create only high-priority issues with confirmation
./scripts/create_issues.sh --priority

# Show help
./scripts/create_issues.sh --help
```

**What it does:**
- Creates GitHub issues directly from command line
- Includes proper labels, descriptions, and acceptance criteria
- Can create issues interactively or automatically
- Focuses on high-priority improvements first

**Issues Available:**
- Total: 46 improvement ideas
- High Priority: 8 issues
- Categories: Mobile, Backend, AI/ML, UX/UI, Security, DevOps, Documentation

## Manual Issue Creation

If you prefer to create issues manually:

1. Open [FUTURE_IMPROVEMENTS.md](../FUTURE_IMPROVEMENTS.md)
2. Choose an issue to create
3. Go to your GitHub repository issues page
4. Click "New Issue"
5. Copy the title and description
6. Add appropriate labels
7. Submit

## Contributing

When adding new scripts:

1. Make them executable: `chmod +x scripts/your_script.sh`
2. Add usage documentation here
3. Include error handling
4. Test on both macOS and Linux (if applicable)

## Future Scripts

Planned utility scripts:

- `backup.sh` - Backup database and files
- `deploy.sh` - Automated deployment
- `test.sh` - Run all tests
- `setup.sh` - Initial project setup
- `migrate.sh` - Database migrations
