# Telegram Manager Updater

Telegram Manager Updater is a version management repository that tracks version information, repository URL, and changelog for a Telegram management application. The repository contains a single JSON configuration file that serves as a version manifest.

Always reference these instructions first and fallback to search or bash commands only when you encounter unexpected information that does not match the info here.

## Working Effectively

This repository requires no build system, compilation, or complex dependencies. All operations are file-based with JSON validation.

### Essential Setup Commands
- `cd /home/runner/work/telegram-manager-updater/telegram-manager-updater` - Navigate to repository root
- `ls -la` - View repository contents (typically shows: .git/, .github/, version.json)
- `git --no-pager status` - Check current git status (takes <1 second)
- `jq . version.json` - Validate and pretty-print JSON file (takes <1 second)

### Validation Commands - ALWAYS Run These
- `jq . version.json` - Validate JSON syntax and structure. If jq fails, use: `python3 -m json.tool version.json`
- `file version.json` - Verify file type (should show "JSON text data")
- `git --no-pager diff` - Check for uncommitted changes
- `git --no-pager log --oneline -5` - View recent commit history

## Core Operations

### Version Updates
Always follow this exact sequence when updating version information:

1. **Create backup**: `cp version.json version.json.backup`
2. **Make changes using jq**: 
   - Update version: `jq '.version = "X.Y.Z"' version.json > version.json.tmp && mv version.json.tmp version.json`
   - Update changelog: `jq '.changelog = "- New feature\n- Bug fix"' version.json > version.json.tmp && mv version.json.tmp version.json`
3. **Validate changes**: `jq . version.json`
4. **Review differences**: `git --no-pager diff version.json`
5. **Clean up**: `rm version.json.backup` (only after confirming changes are correct)

### Manual Editing Alternative
If jq modifications are complex, use direct file editing:
1. `cp version.json version.json.backup` - Create backup
2. Edit version.json using your preferred editor
3. `jq . version.json` - Validate JSON syntax
4. `git --no-pager diff version.json` - Review changes

### Git Workflow
- `git --no-pager status` - Check repository state
- `git add version.json` - Stage changes
- `git commit -m "Update version to X.Y.Z"` - Commit with descriptive message
- `git --no-pager log --oneline -3` - Verify commit was created

## Validation Scenarios

Always run these validation scenarios after making ANY changes:

### JSON Integrity Test
```bash
# Primary validation
jq . version.json

# Fallback validation if jq unavailable
python3 -m json.tool version.json

# Both should output properly formatted JSON without errors
```

### Version Schema Validation
Verify the JSON contains these required fields:
- `version`: String in semantic versioning format (e.g., "1.1.0")
- `url`: Repository URL string
- `changelog`: Multi-line string with changelog entries

### Complete Workflow Test
Execute this complete scenario to verify repository functionality:
1. `ls -la` - Confirm version.json exists
2. `jq . version.json` - Validate current JSON
3. `cp version.json version.json.test`
4. `jq '.version = "999.999.999"' version.json.test > version.json.tmp && mv version.json.tmp version.json.test`
5. `jq . version.json.test` - Validate test modification
6. `rm version.json.test` - Clean up test file

## Repository Structure

### Current Files
```
.
├── .git/           # Git repository data
├── .github/        # GitHub configuration (including these instructions)
└── version.json    # Main configuration file
```

### version.json Schema
```json
{
  "version": "1.1.0",                                    // Semantic version string
  "url": "https://github.com/upterza000/telegram-manager-updater.git",  // Repository URL
  "changelog": "- เพิ่มฟีเจอร์ A\n- แก้ไขข้อผิดพลาด B\n- ปรับปรุงประสิทธิภาพ"  // Multi-line changelog (Thai language)
}
```

## Performance Expectations

All operations in this repository are extremely fast:
- JSON validation: <1 second
- Git operations: <1 second  
- File operations: <1 second
- **No long-running builds or tests** - This is a configuration-only repository

## Common Tasks

### Update Version Number
```bash
# Replace "X.Y.Z" with desired version
jq '.version = "X.Y.Z"' version.json > version.json.tmp && mv version.json.tmp version.json
jq . version.json  # Validate
```

### Add Changelog Entry
```bash
# Add new entry to beginning of changelog
CURRENT_CHANGELOG=$(jq -r '.changelog' version.json)
NEW_ENTRY="- New feature description"
jq --arg new "$NEW_ENTRY\n$CURRENT_CHANGELOG" '.changelog = $new' version.json > version.json.tmp && mv version.json.tmp version.json
```

### Repository Information
- **Primary file**: version.json (contains all configuration)
- **Language**: JSON configuration with Thai language changelog
- **No dependencies**: Pure JSON file repository
- **No build process**: Direct file editing and validation only
- **Version control**: Standard Git workflow

## Error Handling

### JSON Syntax Errors
If `jq . version.json` fails:
1. Check for missing commas, brackets, or quotes
2. Use `python3 -m json.tool version.json` for detailed error messages
3. Restore from backup: `cp version.json.backup version.json` (if backup exists)

### Git Issues
- Always use `git --no-pager` commands to avoid pagination timeouts
- Check `git --no-pager status` before any git operations
- Use descriptive commit messages for version updates

### File Permissions
All files should be readable/writable. If permission errors occur:
- Check file ownership: `ls -la version.json`
- Ensure you're in the correct directory: `pwd`

## Critical Notes

- **NEVER** delete version.json without a backup
- **ALWAYS** validate JSON syntax after any manual edits
- **ALWAYS** use `jq` or `python3 -m json.tool` for JSON validation
- This repository requires no build, test, or deployment processes
- All changes are immediately effective after file modification and git commit
- The changelog field contains Thai language text - preserve encoding when editing