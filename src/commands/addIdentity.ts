import * as vscode from 'vscode';
import { WebviewManager } from '../ui/webviewManager';

export function registerAddIdentityCommand(
  context: vscode.ExtensionContext,
  webviewManager: WebviewManager
): vscode.Disposable {
  return vscode.commands.registerCommand('gitswitch.addIdentity', () => {
    webviewManager.createOrShow();
  });
}
