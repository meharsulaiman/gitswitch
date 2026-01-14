import * as vscode from 'vscode';
import { MultiRepoManager, RepoInfo } from '../core/multiRepoManager';
import { IdentityStore } from '../core/identityStore';
import { GitService } from '../core/gitService';
import { SshService } from '../core/sshService';
import { Identity } from '../core/types';

export class RepoPanel {
  private treeView: vscode.TreeView<RepoTreeItem>;
  private treeDataProvider: RepoTreeDataProvider;
  private multiRepoManager: MultiRepoManager;
  private identityStore: IdentityStore;
  private gitService: GitService;
  private sshService: SshService;
  private repoStore: any;

  constructor(
    context: vscode.ExtensionContext,
    multiRepoManager: MultiRepoManager,
    identityStore: IdentityStore,
    gitService: GitService,
    sshService: SshService,
    repoStore: any
  ) {
    this.multiRepoManager = multiRepoManager;
    this.identityStore = identityStore;
    this.gitService = gitService;
    this.sshService = sshService;
    this.repoStore = repoStore;

    this.treeDataProvider = new RepoTreeDataProvider(
      multiRepoManager,
      identityStore,
      gitService
    );

    this.treeView = vscode.window.createTreeView('gitswitch.repos', {
      treeDataProvider: this.treeDataProvider,
      showCollapseAll: true,
    });

    // Handle item selection
    this.treeView.onDidChangeSelection(async (e) => {
      if (e.selection.length > 0) {
        const item = e.selection[0];
        if (item.type === 'repo' && item.repoInfo) {
          // Show repo details or allow identity selection
          await this.handleRepoSelection(item.repoInfo);
        }
      }
    });

    // Refresh when identities change
    context.subscriptions.push(
      vscode.workspace.onDidChangeWorkspaceFolders(() => {
        this.refresh();
      })
    );
  }

  async refresh(): Promise<void> {
    await this.treeDataProvider.refresh();
  }

  async handleRepoSelection(repoInfo: RepoInfo): Promise<void> {
    const identities = await this.identityStore.getAll();
    
    if (identities.length === 0) {
      vscode.window.showInformationMessage(
        'No identities configured. Please add an identity first.',
        'Add Identity'
      ).then((action) => {
        if (action === 'Add Identity') {
          vscode.commands.executeCommand('gitswitch.addIdentity');
        }
      });
      return;
    }

    // Show quick pick to select identity
    const items = identities.map((id) => ({
      label: id.label,
      description: `${id.name} <${id.email}>`,
      detail: repoInfo.binding?.identityId === id.id ? 'Current' : undefined,
      identity: id,
    }));

    const selected = await vscode.window.showQuickPick(items, {
      placeHolder: `Select identity for ${repoInfo.name}`,
    });

    if (selected) {
      await this.applyIdentityToRepo(repoInfo, selected.identity);
    }
  }

  private async applyIdentityToRepo(repoInfo: RepoInfo, identity: Identity): Promise<void> {
    try {
      const sshCommand = this.sshService.generateSshCommand(identity.sshKeyPath);
      await this.gitService.applyIdentity(repoInfo.path, {
        name: identity.name,
        email: identity.email,
        sshCommand: sshCommand,
      });

      // Update binding
      if (this.repoStore) {
        await this.repoStore.setBinding(repoInfo.path, identity.id, false);
      }

      // Refresh the tree
      await this.refresh();
      await this.multiRepoManager.refreshRepo(repoInfo.path);

      vscode.window.showInformationMessage(
        `Applied identity "${identity.label}" to ${repoInfo.name}`
      );
    } catch (error: any) {
      vscode.window.showErrorMessage(
        `Failed to apply identity: ${error.message}`
      );
    }
  }
}

class RepoTreeDataProvider implements vscode.TreeDataProvider<RepoTreeItem> {
  private _onDidChangeTreeData: vscode.EventEmitter<RepoTreeItem | undefined | null | void> =
    new vscode.EventEmitter<RepoTreeItem | undefined | null | void>();
  readonly onDidChangeTreeData: vscode.Event<RepoTreeItem | undefined | null | void> =
    this._onDidChangeTreeData.event;

  private multiRepoManager: MultiRepoManager;
  private identityStore: IdentityStore;
  private gitService: GitService;

  constructor(
    multiRepoManager: MultiRepoManager,
    identityStore: IdentityStore,
    gitService: GitService
  ) {
    this.multiRepoManager = multiRepoManager;
    this.identityStore = identityStore;
    this.gitService = gitService;
  }

  async refresh(): Promise<void> {
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: RepoTreeItem): vscode.TreeItem {
    return element;
  }

  async getChildren(element?: RepoTreeItem): Promise<RepoTreeItem[]> {
    if (!element) {
      // Root level: show workspace folders
      const workspaceFolders = vscode.workspace.workspaceFolders || [];
      return workspaceFolders.map(
        (folder) =>
          new RepoTreeItem(
            folder.name,
            vscode.TreeItemCollapsibleState.Collapsed,
            'workspace',
            undefined,
            folder
          )
      );
    }

    if (element.type === 'workspace') {
      // Show repos for this workspace
      const repos = await this.multiRepoManager.getReposForWorkspace(
        element.workspaceFolder!
      );
      const items = await Promise.all(repos.map((repo) => this.createRepoTreeItem(repo)));
      return items;
    }

    return [];
  }

  private async createRepoTreeItem(repoInfo: RepoInfo): Promise<RepoTreeItem> {
    let label = repoInfo.name;
    let description = '';
    let tooltip = repoInfo.path;

    if (repoInfo.binding) {
      const identity = await this.identityStore.get(repoInfo.binding.identityId);
      if (identity) {
        description = identity.label;
        tooltip = `${repoInfo.path}\nIdentity: ${identity.label} (${identity.email})`;
        
        // Check for mismatch
        if (repoInfo.currentConfig) {
          if (repoInfo.currentConfig.email !== identity.email) {
            description += ' ⚠️ Mismatch';
            tooltip += `\n⚠️ Config mismatch: Expected ${identity.email}, Found ${repoInfo.currentConfig.email}`;
          }
        }
      } else {
        description = 'Identity not found';
      }
    } else {
      description = 'No identity bound';
      if (repoInfo.currentConfig) {
        tooltip += `\nCurrent config: ${repoInfo.currentConfig.email}`;
      }
    }

    const item = new RepoTreeItem(
      label,
      vscode.TreeItemCollapsibleState.None,
      'repo',
      repoInfo,
      undefined
    );
    item.description = description;
    item.tooltip = tooltip;
    item.contextValue = repoInfo.binding ? 'repo-bound' : 'repo-unbound';
    item.command = {
      command: 'gitswitch.selectRepoIdentity',
      title: 'Select Identity',
      arguments: [repoInfo],
    };

    return item;
  }
}

class RepoTreeItem extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    public readonly type: 'workspace' | 'repo',
    public readonly repoInfo?: RepoInfo,
    public readonly workspaceFolder?: vscode.WorkspaceFolder
  ) {
    super(label, collapsibleState);

    if (type === 'workspace') {
      this.iconPath = new vscode.ThemeIcon('folder');
    } else {
      this.iconPath = new vscode.ThemeIcon('git-branch');
    }
  }
}
