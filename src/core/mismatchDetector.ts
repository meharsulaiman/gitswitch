import * as vscode from 'vscode';
import { GitService } from './gitService';
import { RepoStore } from './repoStore';
import { IdentityStore } from './identityStore';
import { GitConfig } from './types';

export interface MismatchResult {
  hasMismatch: boolean;
  repoPath: string;
  currentConfig?: GitConfig;
  expectedIdentity?: { name: string; email: string };
  reason?: string;
}

export class MismatchDetector {
  private gitService: GitService;
  private repoStore: RepoStore;
  private identityStore: IdentityStore;

  constructor(
    gitService: GitService,
    repoStore: RepoStore,
    identityStore: IdentityStore
  ) {
    this.gitService = gitService;
    this.repoStore = repoStore;
    this.identityStore = identityStore;
  }

  async detectMismatch(repoPath: string): Promise<MismatchResult> {
    const binding = await this.repoStore.getBinding(repoPath);
    if (!binding) {
      return { hasMismatch: false, repoPath };
    }

    const identity = await this.identityStore.get(binding.identityId);
    if (!identity) {
      return {
        hasMismatch: true,
        repoPath,
        reason: 'Identity not found',
      };
    }

    const currentConfig = await this.gitService.getGitConfig(repoPath);
    if (!currentConfig) {
      return {
        hasMismatch: true,
        repoPath,
        expectedIdentity: { name: identity.name, email: identity.email },
        reason: 'No Git config found',
      };
    }

    if (currentConfig.email !== identity.email) {
      return {
        hasMismatch: true,
        repoPath,
        currentConfig,
        expectedIdentity: { name: identity.name, email: identity.email },
        reason: 'Email mismatch',
      };
    }

    if (currentConfig.name !== identity.name) {
      return {
        hasMismatch: true,
        repoPath,
        currentConfig,
        expectedIdentity: { name: identity.name, email: identity.email },
        reason: 'Name mismatch',
      };
    }

    return { hasMismatch: false, repoPath };
  }

  async showMismatchPrompt(mismatch: MismatchResult): Promise<'switch' | 'override' | 'cancel'> {
    if (!mismatch.hasMismatch || !mismatch.currentConfig || !mismatch.expectedIdentity) {
      return 'cancel';
    }

    const message = `Identity mismatch detected in ${mismatch.repoPath}\n\n` +
      `Current: ${mismatch.currentConfig.name} <${mismatch.currentConfig.email}>\n` +
      `Expected: ${mismatch.expectedIdentity.name} <${mismatch.expectedIdentity.email}>\n\n` +
      `Reason: ${mismatch.reason}`;

    const action = await vscode.window.showWarningMessage(
      message,
      'Switch Identity',
      'Override',
      'Cancel'
    );

    if (action === 'Switch Identity') {
      return 'switch';
    } else if (action === 'Override') {
      return 'override';
    }

    return 'cancel';
  }
}
