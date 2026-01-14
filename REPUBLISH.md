# How to Republish GitSwitch Extension

## Quick Steps

### 1. Update Version Number
The version has been updated to `0.2.0` in `package.json` (new feature: multi-repo support).

### 2. Build the Extension
```bash
npm run compile:all
```

### 3. Package the Extension (Optional - for testing)
```bash
vsce package
```
This creates a `.vsix` file you can test locally before publishing.

### 4. Publish to Marketplace
```bash
vsce publish
```

## What Changed in This Version (0.2.0)

- ✨ **New Feature**: Multi-repository support
  - Detects multiple Git repositories within a single workspace folder
  - Shows all repos in a new "Git Repositories" panel
  - Allows selecting different identities for each repo
  - Status bar shows identity for the active file's repository

## Full Republish Workflow

```bash
# 1. Make sure you're logged in (if not already)
vsce login sulaimanshabbir31

# 2. Build everything
npm run compile:all

# 3. Publish (version is already updated)
vsce publish
```

## Verify Publication

After publishing, check:
1. Go to https://marketplace.visualstudio.com/manage
2. Find "GitSwitch - Multi Account Manager"
3. Verify version 0.2.0 is published
4. Check the extension page: https://marketplace.visualstudio.com/items?itemName=sulaimanshabbir31.gitswitch

## Troubleshooting

### If you get "Already logged in" error:
- You're already logged in, proceed to publish

### If you get "Version already exists":
- Increment version in package.json (e.g., 0.2.0 → 0.2.1)

### If you get PAT token errors:
- Your token may have expired
- Create a new PAT at: https://dev.azure.com → User Settings → Personal Access Tokens
- Scope: Marketplace → Manage
- Login again: `vsce login sulaimanshabbir31`

## Version History

- **0.2.0** - Multi-repository support, repository panel UI
- **0.1.0** - Initial release
