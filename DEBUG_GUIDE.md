# VS Code Webview Debugging Guide

## Step-by-Step Debugging Process

### Step 1: Check Extension Host Console (Main VS Code Window)

1. In the **original VS Code window** (where you pressed F5):
   - Go to **View → Debug Console** (or press `Ctrl+Shift+Y`)
   - Look for messages starting with "Extension:"
   - Check for any errors or warnings

**What to look for:**
- `Extension: Webview panel created, waiting for load request`
- `Extension: Received message from webview`
- Any error messages

### Step 2: Check Webview Developer Tools (Extension Development Host)

1. In the **Extension Development Host window** (where webview is shown):
   - **Right-click inside the webview** → Select **"Inspect"** or **"Developer Tools"**
   - If right-click doesn't work, try:
     - Press `Ctrl+Shift+I` (Windows/Linux) or `Cmd+Option+I` (Mac)
     - Or go to **Help → Toggle Developer Tools**

2. In the Developer Tools:
   - **Console Tab**: Look for messages starting with "Webview:"
   - **Network Tab**: Check if `webview.js` is loading (status should be 200)
   - **Elements Tab**: Check if `<div id="root">` exists

**What to look for:**
- `Webview: Starting React app initialization`
- `Webview: Root element found`
- `Webview: App component rendered successfully`
- `Webview: Received message`
- Any **red error messages**

### Step 3: Verify Resource Loading

1. In the **Network tab** of webview Developer Tools:
   - Look for `webview.js`
   - Check if it loads successfully (status 200)
   - If it fails (404 or other error), the script isn't being found

2. Check the **script source**:
   - In Elements tab, find `<script src="...">`
   - The URL should start with `vscode-webview://` or similar
   - If it's a file:// URL, that's the problem

### Step 4: Check Content Security Policy

1. In **Elements tab**, look for the `<meta http-equiv="Content-Security-Policy">` tag
2. Verify it includes:
   - `script-src vscode-resource:` (or `vscode-webview:`)
   - `style-src vscode-resource: 'unsafe-inline'`

### Step 5: Test Minimal Webview

If nothing works, test with a minimal HTML to isolate the issue:

```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src vscode-resource:;">
</head>
<body>
    <h1>Test Webview</h1>
    <script>
        console.log('Script loaded!');
        const vscode = acquireVsCodeApi();
        vscode.postMessage({ type: 'test' });
    </script>
</body>
</html>
```

### Step 6: Common Issues and Fixes

#### Issue 1: Script Not Loading (404 Error)
**Cause**: Wrong path or `asWebviewUri` not used
**Fix**: Ensure using `panel.webview.asWebviewUri(uri)`

#### Issue 2: CSP Blocking Scripts
**Cause**: CSP doesn't allow `vscode-resource:` scheme
**Fix**: Update CSP to include `script-src vscode-resource:`

#### Issue 3: acquireVsCodeApi() Error
**Cause**: Called multiple times or in wrong context
**Fix**: Call once at module level, store in variable

#### Issue 4: Messages Not Received
**Cause**: Listener not set up before message sent
**Fix**: Set up listener first, then send message

#### Issue 5: React Not Rendering
**Cause**: React bundle not loading or error in React code
**Fix**: Check console for React errors, verify webpack bundle

## Quick Diagnostic Commands

Run these in the webview console:

```javascript
// Check if vscode API is available
console.log(typeof acquireVsCodeApi);

// Check if root element exists
console.log(document.getElementById('root'));

// Check if React is loaded
console.log(typeof React);

// Check if script loaded
console.log('Script executed');
```

## Expected Log Flow

**Extension Console:**
1. `Extension: Webview panel created, waiting for load request`
2. `Extension: Received message from webview {type: 'load'}`
3. `Extension: Loading identities`
4. `Extension: Sending identities to webview []`

**Webview Console:**
1. `Webview: Starting React app initialization`
2. `Webview: Root element found, creating React root`
3. `Webview: Rendering App component`
4. `Webview: App component rendered successfully`
5. `Webview: Setting up message listener`
6. `Webview: Requesting initial data`
7. `Webview: Initial load message sent`
8. `Webview: Received message {type: 'load', payload: []}`
9. `Webview: Loading identities []`
10. `Webview: Setting identities state []`

If any step is missing, that's where the issue is!
