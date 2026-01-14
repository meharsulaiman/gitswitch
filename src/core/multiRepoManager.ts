import * as vscode from 'vscode';
import * as path from 'path';
import { GitService } from './gitService';
import { RepoStore } from './repoStore';
import { IdentityStore } from './identityStore';

export interface RepoInfo {
  path: string;
  name: string;
  workspaceFolder: vscode.WorkspaceFolder;
  binding?: { identityId: string; enforced: boolean };
  currentConfig?: { name: string; email: string };
}

export class MultiRepoManager {
  private gitService: GitService;
  private repoStore: RepoStore;
  private identityStore: IdentityStore;
  private reposByWorkspace: Map<string, RepoInfo[]> = new Map();

  constructor(
    gitService: GitService,
    repoStore: RepoStore,
    identityStore: IdentityStore
  ) {
    this.gitService = gitService;
    this.repoStore = repoStore;
    this.identityStore = identityStore;
  }

  async scanWorkspaceFolder(workspaceFolder: vscode.WorkspaceFolder): Promise<RepoInfo[]> {
    const repos: RepoInfo[] = [];
    
    try {
      // First, check if workspace root itself is a Git repo
      const rootRepo = await this.gitService.findGitRoot(workspaceFolder.uri.fsPath);
      if (rootRepo === workspaceFolder.uri.fsPath) {
        const repoInfo = await this.createRepoInfo(rootRepo, workspaceFolder);
        if (repoInfo) {
          repos.push(repoInfo);
        }
      }

      // Then scan for nested repos
      const allRepos = await this.gitService.findAllGitRepos(workspaceFolder.uri.fsPath);
      
      for (const repoPath of allRepos) {
        // Skip if we already added the root repo
        if (repoPath === workspaceFolder.uri.fsPath && repos.length > 0 && repos[0].path === repoPath) {
          continue;
        }

        const repoInfo = await this.createRepoInfo(repoPath, workspaceFolder);
        if (repoInfo) {
          repos.push(repoInfo);
        }
      }

      this.reposByWorkspace.set(workspaceFolder.uri.fsPath, repos);
      return repos;
    } catch (error) {
      console.error(`Failed to scan workspace folder ${workspaceFolder.uri.fsPath}:`, error);
      return [];
    }
  }

  private async createRepoInfo(
    repoPath: string,
    workspaceFolder: vscode.WorkspaceFolder
  ): Promise<RepoInfo | undefined> {
    try {
      const binding = await this.repoStore.getBinding(repoPath);
      const currentConfig = await this.gitService.getGitConfig(repoPath);
      
      // Get repo name (last part of path)
      const repoName = path.basename(repoPath);
      
      return {
        path: repoPath,
        name: repoName,
        workspaceFolder,
        binding: binding ? { identityId: binding.identityId, enforced: binding.enforced } : undefined,
        currentConfig,
      };
    } catch (error) {
      console.error(`Failed to create repo info for ${repoPath}:`, error);
      return undefined;
    }
  }

  async getReposForWorkspace(workspaceFolder: vscode.WorkspaceFolder): Promise<RepoInfo[]> {
    const cached = this.reposByWorkspace.get(workspaceFolder.uri.fsPath);
    if (cached) {
      return cached;
    }
    return await this.scanWorkspaceFolder(workspaceFolder);
  }

  async getAllRepos(): Promise<RepoInfo[]> {
    const allRepos: RepoInfo[] = [];
    const workspaceFolders = vscode.workspace.workspaceFolders || [];
    
    for (const folder of workspaceFolders) {
      const repos = await this.getReposForWorkspace(folder);
      allRepos.push(...repos);
    }
    
    return allRepos;
  }

  async findRepoForFile(filePath: string): Promise<RepoInfo | undefined> {
    const allRepos = await this.getAllRepos();
    
    // Sort by path length (longest first) to match most specific repo first
    const sortedRepos = allRepos.sort((a, b) => b.path.length - a.path.length);
    
    const normalizedFilePath = path.normalize(filePath);
    
    for (const repo of sortedRepos) {
      const normalizedRepoPath = path.normalize(repo.path);
      if (normalizedFilePath.startsWith(normalizedRepoPath + path.sep) || 
          normalizedFilePath === normalizedRepoPath) {
        return repo;
      }
    }
    
    return undefined;
  }

  async refreshRepo(repoPath: string): Promise<void> {
    const allRepos = await this.getAllRepos();
    const repo = allRepos.find(r => r.path === repoPath);
    
    if (repo) {
      const updated = await this.createRepoInfo(repoPath, repo.workspaceFolder);
      if (updated) {
        const workspaceRepos = this.reposByWorkspace.get(repo.workspaceFolder.uri.fsPath);
        if (workspaceRepos) {
          const index = workspaceRepos.findIndex(r => r.path === repoPath);
          if (index >= 0) {
            workspaceRepos[index] = updated;
          }
        }
      }
    }
  }

  clearCache(workspaceFolder?: vscode.WorkspaceFolder): void {
    if (workspaceFolder) {
      this.reposByWorkspace.delete(workspaceFolder.uri.fsPath);
    } else {
      this.reposByWorkspace.clear();
    }
  }
}
