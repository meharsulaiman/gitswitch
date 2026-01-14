import * as vscode from 'vscode';
import { IdentityStore } from '../core/identityStore';
import { RepoStore } from '../core/repoStore';
import { GitService } from '../core/gitService';
import { COMMANDS } from '../config';

export class StatusBar {
  private statusBarItem: vscode.StatusBarItem;
  private identityStore: IdentityStore;
  private repoStore: RepoStore;
  private gitService: GitService;
  private currentRepoPath: string | undefined;

  constructor(identityStore: IdentityStore, repoStore: RepoStore, gitService: GitService) {
    this.identityStore = identityStore;
    this.repoStore = repoStore;
    this.gitService = gitService;
    this.statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    this.statusBarItem.command = COMMANDS.SWITCH_IDENTITY;
    this.statusBarItem.tooltip = 'Click to switch Git identity';
  }

  async update(repoPath?: string): Promise<void> {
    this.currentRepoPath = repoPath;

    if (!repoPath) {
      this.statusBarItem.hide();
      return;
    }

    try {
      const binding = await this.repoStore.getBinding(repoPath);
      if (!binding) {
        // Check current Git config
        const config = await this.gitService.getGitConfig(repoPath);
        if (config) {
          this.statusBarItem.text = `$(git-branch) ${config.email}`;
          this.statusBarItem.color = new vscode.ThemeColor('statusBarItem.warningForeground');
        } else {
          this.statusBarItem.text = '$(git-branch) No Identity';
          this.statusBarItem.color = new vscode.ThemeColor('statusBarItem.warningForeground');
        }
        this.statusBarItem.show();
        return;
      }

      const identity = await this.identityStore.get(binding.identityId);
      if (!identity) {
        this.statusBarItem.text = '$(alert) Identity Not Found';
        this.statusBarItem.color = new vscode.ThemeColor('statusBarItem.errorForeground');
        this.statusBarItem.show();
        return;
      }

      // Check for mismatch
      const config = await this.gitService.getGitConfig(repoPath);
      if (config && config.email !== identity.email) {
        this.statusBarItem.text = `$(warning) ${identity.label}`;
        this.statusBarItem.color = new vscode.ThemeColor('statusBarItem.warningForeground');
        this.statusBarItem.tooltip = `Mismatch detected. Expected: ${identity.email}, Current: ${config.email}`;
      } else {
        this.statusBarItem.text = `$(check) ${identity.label}`;
        this.statusBarItem.color = undefined;
        this.statusBarItem.tooltip = `${identity.name} <${identity.email}>`;
      }

      this.statusBarItem.show();
    } catch (error) {
      console.error('Failed to update status bar:', error);
      this.statusBarItem.hide();
    }
  }

  dispose(): void {
    this.statusBarItem.dispose();
  }
}
