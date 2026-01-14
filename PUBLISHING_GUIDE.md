# Publishing GitSwitch to VS Code Marketplace

## Prerequisites

1. **Microsoft Account**: Create/use a Microsoft account
2. **Azure DevOps Organization**: Create one at https://dev.azure.com
3. **Personal Access Token (PAT)**: Generate with Marketplace management permissions

## Step 1: Install VS Code Extension Manager (vsce)

```bash
npm install -g @vscode/vsce
```

## Step 2: Create Azure DevOps Organization

1. Go to https://dev.azure.com
2. Sign in with your Microsoft account
3. Create a new organization (e.g., `yourname-dev`)

## Step 3: Create Personal Access Token (PAT)

1. Go to Azure DevOps → User Settings → Personal Access Tokens
2. Click "New Token"
3. Set:
   - **Name**: `VS Code Marketplace`
   - **Organization**: Select your organization
   - **Expiration**: Set appropriate expiration (e.g., 1 year)
   - **Scopes**: Select "Custom defined"
   - **Marketplace**: Select "Manage" (full access)
4. Click "Create"
5. **Copy the token immediately** (you won't see it again!)

## Step 4: Login to Marketplace

```bash
vsce login your-publisher-name
```

When prompted, enter your Personal Access Token.

## Step 5: Update package.json

Make sure your `package.json` has:

```json
{
  "name": "gitswitch",
  "displayName": "GitSwitch",
  "version": "0.1.0",
  "publisher": "your-publisher-name",
  "description": "Never accidentally commit from the wrong GitHub account again. Seamlessly switch between multiple Git identities per repository.",
  "repository": {
    "type": "git",
    "url": "https://github.com/yourusername/gitswitch.git"
  },
  "bugs": {
    "url": "https://github.com/yourusername/gitswitch/issues"
  },
  "homepage": "https://github.com/yourusername/gitswitch#readme",
  "license": "MIT",
  "categories": ["Other", "SCM Providers"],
  "keywords": ["git", "github", "identity", "ssh", "commit", "multi-account"],
  "icon": "media/icon.png"
}
```

## Step 6: Create Extension Icon

1. Create `media/icon.png` (128x128 pixels)
2. Design a simple icon representing Git switching/identity
3. Use tools like:
   - Figma
   - Canva
   - Online icon generators

## Step 7: Create README.md

Create a comprehensive README.md with:
- Extension description
- Features list
- Screenshots
- Installation instructions
- Usage guide
- Configuration options

## Step 8: Create LICENSE

Create a `LICENSE` file (MIT recommended):

```text
MIT License

Copyright (c) 2026 Your Name

Permission is hereby granted...
```

## Step 9: Package Extension

```bash
npm run compile:all
vsce package
```

This creates a `.vsix` file.

## Step 10: Publish Extension

### First Time (Creates Extension)

```bash
vsce publish
```

### Updates (Increment Version First)

1. Update version in `package.json`:
   ```json
   "version": "0.1.1"
   ```

2. Publish:
   ```bash
   vsce publish
   ```

## Step 11: Verify Publication

1. Go to https://marketplace.visualstudio.com/manage
2. Find your extension
3. Check the status (should be "Published")

## Step 12: Share Your Extension

Your extension will be available at:
```
https://marketplace.visualstudio.com/items?itemName=your-publisher-name.gitswitch
```

## Common Issues

### Issue: "Extension name already exists"
**Solution**: Change the `name` field in package.json to something unique

### Issue: "Publisher not found"
**Solution**: Make sure you've logged in with `vsce login`

### Issue: "Invalid icon"
**Solution**: Ensure icon is 128x128 PNG format

### Issue: "Missing repository"
**Solution**: Add repository URL to package.json

## Versioning Best Practices

- Use semantic versioning: `MAJOR.MINOR.PATCH`
- `0.1.0` → `0.1.1` (patch: bug fixes)
- `0.1.0` → `0.2.0` (minor: new features)
- `0.1.0` → `1.0.0` (major: breaking changes)

## Post-Publication Checklist

- [ ] Extension appears in marketplace
- [ ] README displays correctly
- [ ] Screenshots are visible
- [ ] Installation works
- [ ] Extension activates correctly
- [ ] All features work as expected

## Marketing Tips

1. **GitHub Repository**: Create a public repo with:
   - Clear README
   - Screenshots/GIFs
   - Issue templates
   - Contributing guidelines

2. **Social Media**: Share on:
   - Twitter/X
   - Reddit (r/vscode)
   - Dev.to
   - LinkedIn

3. **Documentation**: Create:
   - Usage examples
   - Video tutorials
   - Blog posts

4. **Feedback**: Encourage users to:
   - Rate and review
   - Report issues
   - Suggest features

## Resources

- [VS Code Extension Publishing](https://code.visualstudio.com/api/working-with-extensions/publishing-extension)
- [VS Code Extension Guidelines](https://code.visualstudio.com/api/references/extension-guidelines)
- [Marketplace Policies](https://aka.ms/vsmarketplace-policies)
