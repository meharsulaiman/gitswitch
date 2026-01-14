import * as vscode from 'vscode';
import { GitService } from '../core/gitService';

export type RepoDetectedCallback = (repoPath: string, workspaceFolder: vscode.WorkspaceFolder) => void;

export class WorkspaceWatcher {
  private gitService: GitService;
  private onRepoDetected: RepoDetectedCallback;
  private disposables: vscode.Disposable[] = [];

  constructor(gitService: GitService, onRepoDetected: RepoDetectedCallback) {
    this.gitService = gitService;
    this.onRepoDetected = onRepoDetected;
  }

  start(): void {
    // Scan initial workspace folders
    this.scanWorkspaceFolders();

    // Watch for workspace folder changes
    const workspaceWatcher = vscode.workspace.onDidChangeWorkspaceFolders(async (event) => {
      // Handle added folders
      for (const folder of event.added) {
        await this.scanFolder(folder);
      }
    });

    this.disposables.push(workspaceWatcher);
  }

  private async scanWorkspaceFolders(): Promise<void> {
    const folders = vscode.workspace.workspaceFolders || [];
    for (const folder of folders) {
      await this.scanFolder(folder);
    }
  }

  private async scanFolder(workspaceFolder: vscode.WorkspaceFolder): Promise<void> {
    try {
      // First check if workspace root itself is a Git repo
      const rootRepo = await this.gitService.findGitRoot(workspaceFolder.uri.fsPath);
      if (rootRepo === workspaceFolder.uri.fsPath) {
        this.onRepoDetected(rootRepo, workspaceFolder);
      }

      // Then scan for nested repos
      const allRepos = await this.gitService.findAllGitRepos(workspaceFolder.uri.fsPath);
      for (const repoPath of allRepos) {
        // Skip if we already detected the root repo
        if (repoPath !== workspaceFolder.uri.fsPath || rootRepo !== workspaceFolder.uri.fsPath) {
          this.onRepoDetected(repoPath, workspaceFolder);
        }
      }
    } catch (error) {
      console.error(`Failed to scan folder ${workspaceFolder.uri.fsPath}:`, error);
    }
  }

  dispose(): void {
    this.disposables.forEach(d => d.dispose());
    this.disposables = [];
  }
}
