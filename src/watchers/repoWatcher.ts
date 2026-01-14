import * as vscode from 'vscode';
import { GitService } from '../core/gitService';
import { RepoStore } from '../core/repoStore';
import { IdentityStore } from '../core/identityStore';
import { SshService } from '../core/sshService';

export type IdentityMismatchCallback = (
  repoPath: string,
  currentConfig: { name: string; email: string },
  expectedIdentity: { name: string; email: string }
) => Promise<void>;

export class RepoWatcher {
  private gitService: GitService;
  private repoStore: RepoStore;
  private identityStore: IdentityStore;
  private sshService: SshService;
  private onMismatch: IdentityMismatchCallback;
  private disposables: vscode.Disposable[] = [];

  constructor(
    gitService: GitService,
    repoStore: RepoStore,
    identityStore: IdentityStore,
    sshService: SshService,
    onMismatch: IdentityMismatchCallback
  ) {
    this.gitService = gitService;
    this.repoStore = repoStore;
    this.identityStore = identityStore;
    this.sshService = sshService;
    this.onMismatch = onMismatch;
  }

  async watchRepo(repoPath: string, workspaceFolder: vscode.WorkspaceFolder): Promise<void> {
    try {
      // Check if Git is available
      const gitRoot = await this.gitService.findGitRoot(repoPath);
      if (!gitRoot) {
        return;
      }

      // Check if repo is in a detached HEAD or rebase state (don't interfere)
      const isDetached = await this.isDetachedHead(repoPath);
      if (isDetached) {
        return;
      }

      const binding = await this.repoStore.getBinding(repoPath);
      
      if (!binding) {
        // No binding exists, check if we can match current config to an identity
        await this.tryMatchExistingIdentity(repoPath);
        return;
      }

      const identity = await this.identityStore.get(binding.identityId);
      if (!identity) {
        // Identity was deleted, remove binding
        await this.repoStore.removeBinding(repoPath);
        return;
      }

      // Check for mismatch
      const currentConfig = await this.gitService.getGitConfig(repoPath);
      if (!currentConfig) {
        // No config found, apply identity
        await this.applyIdentity(repoPath, identity);
        return;
      }

      // Check if email matches
      if (currentConfig.email !== identity.email) {
        await this.onMismatch(repoPath, currentConfig, identity);
        return;
      }

      // Check SSH command if identity has SSH key
      const expectedSshCommand = this.sshService.generateSshCommand(identity.sshKeyPath);
      if (currentConfig.sshCommand !== expectedSshCommand) {
        // SSH command mismatch, apply identity
        await this.applyIdentity(repoPath, identity);
      }
    } catch (error: any) {
      // Handle permission errors gracefully
      if (error?.code === 'EACCES' || error?.message?.includes('permission')) {
        console.warn(`Permission denied for repo ${repoPath}`);
        return;
      }
      console.error(`Failed to watch repo ${repoPath}:`, error);
    }
  }

  private async isDetachedHead(repoPath: string): Promise<boolean> {
    try {
      const { execSync } = require('child_process');
      const branch = execSync('git symbolic-ref --short HEAD', {
        cwd: repoPath,
        encoding: 'utf-8',
        stdio: ['ignore', 'pipe', 'ignore']
      }).trim();
      return false;
    } catch {
      // Detached HEAD or other Git state
      return true;
    }
  }

  private async tryMatchExistingIdentity(repoPath: string): Promise<void> {
    const currentConfig = await this.gitService.getGitConfig(repoPath);
    if (!currentConfig) {
      return;
    }

    // Try to find matching identity by email
    const identities = await this.identityStore.getAll();
    const matchingIdentity = identities.find(id => id.email === currentConfig.email);

    if (matchingIdentity) {
      // Found a match, create binding
      await this.repoStore.setBinding(repoPath, matchingIdentity.id, false);
    }
  }

  async applyIdentity(repoPath: string, identity: { name: string; email: string; sshKeyPath: string }): Promise<void> {
    const sshCommand = this.sshService.generateSshCommand(identity.sshKeyPath);
    await this.gitService.applyIdentity(repoPath, {
      name: identity.name,
      email: identity.email,
      sshCommand,
    });
  }

  dispose(): void {
    this.disposables.forEach(d => d.dispose());
    this.disposables = [];
  }
}
