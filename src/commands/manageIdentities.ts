import * as vscode from 'vscode';
import { WebviewManager } from '../ui/webviewManager';

export function registerManageIdentitiesCommand(
  context: vscode.ExtensionContext,
  webviewManager: WebviewManager
): vscode.Disposable {
  return vscode.commands.registerCommand('gitswitch.manageIdentities', () => {
    webviewManager.createOrShow();
  });
}
