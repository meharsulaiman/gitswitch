import * as vscode from 'vscode';
import { IdentityPicker } from '../ui/identityPicker';
import { RepoStore } from '../core/repoStore';
import { GitService } from '../core/gitService';
import { SshService } from '../core/sshService';
import { IdentityStore } from '../core/identityStore';

export function registerSwitchIdentityCommand(
  context: vscode.ExtensionContext,
  identityPicker: IdentityPicker,
  identityStore: IdentityStore,
  repoStore: RepoStore,
  gitService: GitService,
  sshService: SshService
): vscode.Disposable {
  return vscode.commands.registerCommand('gitswitch.switchIdentity', async () => {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders || workspaceFolders.length === 0) {
      vscode.window.showWarningMessage('No workspace folder open');
      return;
    }

    // Get current repo
    const activeFolder = workspaceFolders[0];
    const repoPath = await gitService.findGitRoot(activeFolder.uri.fsPath);
    if (!repoPath) {
      vscode.window.showWarningMessage('Not a Git repository');
      return;
    }

    const selected = await identityPicker.showQuickPick();
    if (!selected) {
      return;
    }

    const identity = await identityStore.get(selected.id);
    if (!identity) {
      vscode.window.showErrorMessage('Identity not found');
      return;
    }

    try {
      // Apply identity
      const sshCommand = sshService.generateSshCommand(identity.sshKeyPath);
      await gitService.applyIdentity(repoPath, {
        name: identity.name,
        email: identity.email,
        sshCommand,
      });

      // Create or update binding
      await repoStore.setBinding(repoPath, identity.id, false);

      vscode.window.showInformationMessage(`Switched to identity: ${identity.label}`);
    } catch (error: any) {
      vscode.window.showErrorMessage(`Failed to switch identity: ${error.message}`);
    }
  });
}
