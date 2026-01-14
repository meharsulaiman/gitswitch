# Setting Up Personal Access Token (PAT) for Publishing

## Issue: PAT Verification Failed

The PAT token verification failed. Here's how to fix it:

## Step 1: Create/Verify Azure DevOps Organization

1. Go to https://dev.azure.com
2. Sign in with your Microsoft account
3. Make sure you have an organization created
4. Your organization name: `sulaimanshabbir31`

## Step 2: Create a New PAT with Correct Permissions

1. Go to Azure DevOps → User Settings → Personal Access Tokens
   - Direct link: https://dev.azure.com/_usersSettings/tokens
   
2. Click "New Token"

3. Fill in the form:
   - **Name**: `VS Code Marketplace Publishing`
   - **Organization**: Select `sulaimanshabbir31` (your organization)
   - **Expiration**: Set expiration date (e.g., 1 year from now)
   - **Scopes**: 
     - Select "Custom defined"
     - Under "Marketplace", select **"Manage"** (full access)
     - This is CRITICAL - the token must have Marketplace manage permissions

4. Click "Create"

5. **Copy the token immediately** - you won't see it again!

## Step 3: Create Publisher (if not exists)

1. Go to https://marketplace.visualstudio.com/manage/publishers/
2. Sign in with your Microsoft account
3. Click "Create Publisher"
4. Fill in:
   - **Publisher ID**: `sulaimanshabbir31` (must be unique, lowercase, alphanumeric)
   - **Publisher Name**: `Sulaiman Shabbir` (or your preferred display name)
   - **Description**: Brief description
5. Click "Create"

## Step 4: Login with vsce

Once you have the correct PAT:

```bash
vsce login sulaimanshabbir31
```

When prompted, paste your PAT token.

## Step 5: Verify PAT

```bash
vsce verify-pat sulaimanshabbir31
```

This should succeed if the PAT is correct.

## Common Issues

### "User not authorized"
- **Solution**: Make sure the PAT has "Marketplace → Manage" scope
- Create a new PAT with the correct permissions

### "Publisher not found"
- **Solution**: Create the publisher first at https://marketplace.visualstudio.com/manage/publishers/
- Make sure the publisher ID matches what you're using in `vsce login`

### "Token expired"
- **Solution**: Create a new PAT with a longer expiration

## Alternative: Use Environment Variable

You can also set the PAT as an environment variable:

**Windows (PowerShell):**
```powershell
$env:VSCE_PAT="your-pat-token-here"
vsce publish
```

**Windows (CMD):**
```cmd
set VSCE_PAT=your-pat-token-here
vsce publish
```

**Linux/Mac:**
```bash
export VSCE_PAT="your-pat-token-here"
vsce publish
```

## Next Steps

Once PAT is verified:
1. Run `npm run compile:all` to build
2. Run `vsce package` to create .vsix file
3. Run `vsce publish` to publish to marketplace
