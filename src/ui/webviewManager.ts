import * as vscode from 'vscode';
import * as path from 'path';
import { IdentityStore } from '../core/identityStore';
import { Identity } from '../core/types';

export class WebviewManager {
  private context: vscode.ExtensionContext;
  private identityStore: IdentityStore;
  private currentPanel: vscode.WebviewPanel | undefined;

  constructor(context: vscode.ExtensionContext, identityStore: IdentityStore) {
    this.context = context;
    this.identityStore = identityStore;
  }

  createOrShow(): void {
    const column = vscode.window.activeTextEditor
      ? vscode.window.activeTextEditor.viewColumn
      : undefined;

    if (this.currentPanel) {
      this.currentPanel.reveal(column);
      return;
    }

    const panel = vscode.window.createWebviewPanel(
      'gitswitchManage',
      'GitSwitch - Manage Identities',
      column || vscode.ViewColumn.One,
      {
        enableScripts: true,
        localResourceRoots: [
          vscode.Uri.file(path.join(this.context.extensionPath, 'out', 'webview'))
        ]
      }
    );

    const webviewUri = vscode.Uri.file(
      path.join(this.context.extensionPath, 'out', 'webview', 'webview.js')
    );
    const webviewSrc = panel.webview.asWebviewUri(webviewUri);

    panel.webview.html = this.getWebviewContent(panel, webviewSrc);

    panel.webview.onDidReceiveMessage(
      async (message) => {
        console.log('Extension: Received message from webview', message);
        switch (message.type) {
          case 'load':
            console.log('Extension: Loading identities');
            try {
              const identities = await this.identityStore.getAll();
              console.log('Extension: Sending identities to webview', identities);
              panel.webview.postMessage({
                type: 'load',
                payload: identities,
              });
            } catch (error) {
              console.error('Extension: Error loading identities', error);
              panel.webview.postMessage({
                type: 'error',
                payload: `Failed to load identities: ${error}`,
              });
            }
            break;

          case 'add':
            try {
              console.log('Extension: Adding identity', message.payload);
              await this.identityStore.add(message.payload);
              const identities = await this.identityStore.getAll();
              console.log('Extension: Identity added, sending updated list', identities);
              panel.webview.postMessage({
                type: 'load',
                payload: identities,
              });
              vscode.window.showInformationMessage('Identity added successfully');
            } catch (error: any) {
              console.error('Extension: Error adding identity', error);
              const errorMessage = error.message || 'Failed to add identity';
              vscode.window.showErrorMessage(`Failed to add identity: ${errorMessage}`);
              panel.webview.postMessage({
                type: 'error',
                payload: errorMessage,
              });
            }
            break;

          case 'update':
            try {
              await this.identityStore.update(message.payload.id, message.payload);
              const identities = await this.identityStore.getAll();
              panel.webview.postMessage({
                type: 'load',
                payload: identities,
              });
              vscode.window.showInformationMessage('Identity updated successfully');
            } catch (error: any) {
              panel.webview.postMessage({
                type: 'error',
                payload: error.message || 'Failed to update identity',
              });
            }
            break;

          case 'delete':
            try {
              await this.identityStore.delete(message.payload.id);
              const identities = await this.identityStore.getAll();
              panel.webview.postMessage({
                type: 'load',
                payload: identities,
              });
              vscode.window.showInformationMessage('Identity deleted successfully');
            } catch (error: any) {
              panel.webview.postMessage({
                type: 'error',
                payload: error.message || 'Failed to delete identity',
              });
            }
            break;
        }
      },
      null,
      this.context.subscriptions
    );

    panel.onDidDispose(
      () => {
        this.currentPanel = undefined;
      },
      null,
      this.context.subscriptions
    );

    this.currentPanel = panel;

    // Don't send initial data here - let the webview request it via message
    // This ensures the webview's message listener is ready
    console.log('Extension: Webview panel created, waiting for load request');
  }

  private getWebviewContent(panel: vscode.WebviewPanel, scriptUri: vscode.Uri): string {
    // Use vscode-resource: scheme in CSP (required for VS Code webviews)
    const cspSource = panel.webview.cspSource;
    
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src ${cspSource} https:; script-src ${cspSource}; style-src ${cspSource} 'unsafe-inline';">
    <title>GitSwitch - Manage Identities</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            font-family: var(--vscode-font-family);
            color: var(--vscode-foreground);
            background-color: var(--vscode-editor-background);
        }
        #root {
            padding: 20px;
        }
    </style>
</head>
<body>
    <div id="root">Loading...</div>
    <script src="${scriptUri}"></script>
</body>
</html>`;
  }
}
