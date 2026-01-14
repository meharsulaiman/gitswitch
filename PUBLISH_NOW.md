# Publish GitSwitch Now - Step by Step

## Your Details
- **Publisher ID**: `sulaimanshabbir31`
- **Organization**: `sulaimanshabbir31`
- **Extension Name**: `gitswitch`

## Step 1: Create Publisher (If Not Done)

1. Go to: https://marketplace.visualstudio.com/manage/publishers/
2. Sign in with Microsoft account
3. If you don't see `sulaimanshabbir31` publisher, click **"Create Publisher"**
4. Fill in:
   - **Publisher ID**: `sulaimanshabbir31`
   - **Publisher Name**: `Sulaiman Shabbir`
   - **Description**: `VS Code Extension Publisher`
5. Click **"Create"**

## Step 2: Create PAT Token with Correct Permissions

1. Go to: https://dev.azure.com/sulaimanshabbir31/_usersSettings/tokens
   (Or: https://dev.azure.com → User Settings → Personal Access Tokens)

2. Click **"New Token"**

3. Fill in exactly:
   - **Name**: `VS Code Marketplace Publishing`
   - **Organization**: `sulaimanshabbir31` ✅
   - **Expiration**: Choose 1-2 years
   - **Scopes**: 
     - ✅ Select **"Custom defined"**
     - ✅ Expand **"Marketplace"** section
     - ✅ Check **"Manage"** (this is CRITICAL!)
     - This gives full Marketplace access

4. Click **"Create"**

5. **COPY THE TOKEN IMMEDIATELY** - You won't see it again!
   - It will look like: `fGYjOTpxqDKAiEgi4ibkm5furKAJqsqQyGETiKydFqjv62OTHeqtJQQJ99CAAC...`

## Step 3: Login with vsce

Run this command and paste your NEW token when prompted:

```bash
vsce login sulaimanshabbir31
```

## Step 4: Verify PAT Works

```bash
vsce verify-pat sulaimanshabbir31
```

Should output: `✓ Personal Access Token verification succeeded!`

## Step 5: Build Extension

```bash
npm run compile:all
```

## Step 6: Package Extension (Test First)

```bash
vsce package
```

This creates `gitswitch-0.1.0.vsix` - you can test install this.

## Step 7: Publish to Marketplace

```bash
vsce publish
```

## Step 8: Verify Publication

After publishing, check:
- https://marketplace.visualstudio.com/manage/publishers/sulaimanshabbir31/extensions
- Your extension should appear there
- Public URL: https://marketplace.visualstudio.com/items?itemName=sulaimanshabbir31.gitswitch

## ⚠️ Common Issues

### "User not authorized"
- **Fix**: Make sure PAT has **"Marketplace → Manage"** scope
- Create a NEW PAT with this exact permission

### "Publisher not found"  
- **Fix**: Create publisher first at https://marketplace.visualstudio.com/manage/publishers/

### "Organization not found"
- **Fix**: Make sure you select `sulaimanshabbir31` when creating PAT
- Verify you can access https://dev.azure.com/sulaimanshabbir31

## 🎯 Quick Command Summary

```bash
# 1. Login (paste your PAT when prompted)
vsce login sulaimanshabbir31

# 2. Verify it works
vsce verify-pat sulaimanshabbir31

# 3. Build
npm run compile:all

# 4. Package (test first)
vsce package

# 5. Publish
vsce publish
```

## 📝 Important Notes

- The PAT token MUST have **"Marketplace → Manage"** permission
- Make sure publisher `sulaimanshabbir31` exists before publishing
- Organization name is `sulaimanshabbir31` (use this when creating PAT)
- After first publish, updates just require version bump + `vsce publish`
