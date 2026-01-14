import * as vscode from 'vscode';
import { RepoPanel } from '../ui/repoPanel';

let repoPanel: RepoPanel | undefined;

export function registerShowReposCommand(
  context: vscode.ExtensionContext,
  panel: RepoPanel
): vscode.Disposable {
  repoPanel = panel;
  
  return vscode.commands.registerCommand('gitswitch.showRepos', async () => {
    // Reveal the tree view
    await vscode.commands.executeCommand('gitswitch.repos.focus');
    await repoPanel?.refresh();
  });
}

export function registerSelectRepoIdentityCommand(
  context: vscode.ExtensionContext,
  panel: RepoPanel
): vscode.Disposable {
  return vscode.commands.registerCommand('gitswitch.selectRepoIdentity', async (repoInfo: any) => {
    if (repoInfo) {
      // Access the private method through a public method or make it public
      await (panel as any).handleRepoSelection(repoInfo);
    }
  });
}
