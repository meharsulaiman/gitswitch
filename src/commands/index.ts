import * as vscode from 'vscode';
import { registerAddIdentityCommand } from './addIdentity';
import { registerSwitchIdentityCommand } from './switchIdentity';
import { registerBindRepoCommand } from './bindRepo';
import { registerManageIdentitiesCommand } from './manageIdentities';
import { WebviewManager } from '../ui/webviewManager';
import { IdentityPicker } from '../ui/identityPicker';
import { IdentityStore } from '../core/identityStore';
import { RepoStore } from '../core/repoStore';
import { GitService } from '../core/gitService';
import { SshService } from '../core/sshService';

export function registerAllCommands(
  context: vscode.ExtensionContext,
  webviewManager: WebviewManager,
  identityPicker: IdentityPicker,
  identityStore: IdentityStore,
  repoStore: RepoStore,
  gitService: GitService,
  sshService: SshService
): vscode.Disposable[] {
  return [
    registerAddIdentityCommand(context, webviewManager),
    registerSwitchIdentityCommand(context, identityPicker, identityStore, repoStore, gitService, sshService),
    registerBindRepoCommand(context, identityPicker, identityStore, repoStore, gitService, sshService),
    registerManageIdentitiesCommand(context, webviewManager),
  ];
}
