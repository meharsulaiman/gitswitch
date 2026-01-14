# Quick Publishing Guide for GitSwitch

## ⚠️ PAT Token Issue

Your PAT token verification failed. This usually means:

1. **The PAT doesn't have Marketplace permissions** - Most common issue
2. **Publisher doesn't exist yet** - Need to create it first
3. **Token expired or invalid** - Need to create a new one

## 🔧 Fix Steps

### Step 1: Create Publisher (Do This First!)

1. Go to: https://marketplace.visualstudio.com/manage/publishers/
2. Sign in with your Microsoft account
3. Click **"Create Publisher"** button
4. Fill in:
   - **Publisher ID**: `sulaimanshabbir31` (must be lowercase, unique)
   - **Publisher Name**: `Sulaiman Shabbir` (or your display name)
   - **Description**: `VS Code Extension Publisher`
5. Click **"Create"**

### Step 2: Create New PAT with Marketplace Permissions

1. Go to: https://dev.azure.com/_usersSettings/tokens
2. Click **"New Token"**
3. Fill in:
   - **Name**: `VS Code Marketplace - GitSwitch`
   - **Organization**: Select `sulaimanshabbir31` (your organization)
   - **Expiration**: Set to 1-2 years
   - **Scopes**: 
     - ✅ Select **"Custom defined"**
     - ✅ Under **"Marketplace"**, check **"Manage"** (FULL ACCESS)
     - This is the critical step!
4. Click **"Create"**
5. **Copy the token** (you won't see it again!)

### Step 3: Login with vsce

```bash
vsce login sulaimanshabbir31
```

When prompted, paste your NEW PAT token.

### Step 4: Verify It Works

```bash
vsce verify-pat sulaimanshabbir31
```

Should say "✓ Personal Access Token verification succeeded!"

## 🚀 Publishing Steps

Once PAT is verified:

### 1. Build Extension
```bash
npm run compile:all
```

### 2. Package Extension (Test First)
```bash
vsce package
```

This creates `gitswitch-0.1.0.vsix` - you can test install this locally.

### 3. Publish to Marketplace
```bash
vsce publish
```

### 4. Verify Publication

1. Go to: https://marketplace.visualstudio.com/manage/publishers/sulaimanshabbir31/extensions
2. Your extension should appear there
3. It will be available at: https://marketplace.visualstudio.com/items?itemName=sulaimanshabbir31.gitswitch

## 📝 Pre-Publishing Checklist

- [x] Extension name: `gitswitch`
- [x] Publisher: `sulaimanshabbir31`
- [x] Version: `0.1.0`
- [x] Icon exists: `media/icons/icon.png`
- [x] README.md updated
- [x] LICENSE file created
- [ ] PAT token has Marketplace → Manage permissions
- [ ] Publisher created at marketplace
- [ ] Extension builds successfully
- [ ] Extension packages successfully

## 🔄 For Future Updates

When updating the extension:

1. Update version in `package.json`:
   ```json
   "version": "0.1.1"
   ```

2. Build and publish:
   ```bash
   npm run compile:all
   vsce publish
   ```

## 🆘 Still Having Issues?

If PAT still doesn't work:

1. **Double-check Marketplace permissions** - This is the #1 issue
2. **Make sure publisher exists** - Check https://marketplace.visualstudio.com/manage/publishers/
3. **Try creating PAT from Azure DevOps directly** - Sometimes the UI differs
4. **Check token expiration** - Make sure it's not expired
5. **Verify organization** - Make sure you're using the right Azure DevOps org

## 📞 Alternative: Manual Upload

If vsce continues to have issues, you can:

1. Package the extension: `vsce package`
2. Go to: https://marketplace.visualstudio.com/manage/publishers/sulaimanshabbir31/extensions
3. Click "New Extension" → "Visual Studio Code"
4. Upload the `.vsix` file manually
