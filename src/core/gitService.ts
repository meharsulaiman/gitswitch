import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { GitConfig, GitProvider } from './types';

export class GitService {
  private gitApi: any;

  constructor() {
    this.initializeGitApi();
  }

  private initializeGitApi(): void {
    try {
      const gitExtension = vscode.extensions.getExtension('vscode.git');
      if (gitExtension && gitExtension.isActive) {
        this.gitApi = gitExtension.exports.getAPI(1);
      }
    } catch (error) {
      console.error('Failed to initialize Git API:', error);
    }
  }

  async getRepository(workspaceFolder: vscode.WorkspaceFolder): Promise<any> {
    if (!this.gitApi) {
      return undefined;
    }

    const repositories = this.gitApi.repositories;
    for (const repo of repositories) {
      if (repo.rootUri.fsPath === workspaceFolder.uri.fsPath) {
        return repo;
      }
    }

    return undefined;
  }

  async findGitRoot(folderPath: string): Promise<string | undefined> {
    let currentPath = folderPath;
    const root = path.parse(currentPath).root;

    while (currentPath !== root) {
      const gitPath = path.join(currentPath, '.git');
      try {
        const stats = await fs.promises.stat(gitPath);
        if (stats.isDirectory() || stats.isFile()) {
          return currentPath;
        }
      } catch {
        // .git doesn't exist, continue searching
      }

      currentPath = path.dirname(currentPath);
    }

    return undefined;
  }

  async findAllGitRepos(folderPath: string, maxDepth: number = 5): Promise<string[]> {
    const repos: string[] = [];
    const visited = new Set<string>();

    const scanDirectory = async (dirPath: string, depth: number): Promise<void> => {
      if (depth > maxDepth) {
        return;
      }

      const normalizedPath = path.normalize(dirPath);
      if (visited.has(normalizedPath)) {
        return;
      }
      visited.add(normalizedPath);

      try {
        // Check if current directory is a Git repo
        const gitPath = path.join(dirPath, '.git');
        try {
          const stats = await fs.promises.stat(gitPath);
          if (stats.isDirectory() || stats.isFile()) {
            repos.push(dirPath);
            return; // Don't scan inside a Git repo
          }
        } catch {
          // Not a Git repo, continue scanning
        }

        // Read directory contents
        const entries = await fs.promises.readdir(dirPath, { withFileTypes: true });

        for (const entry of entries) {
          // Skip hidden files/directories and common ignore patterns
          if (entry.name.startsWith('.') && entry.name !== '.git') {
            continue;
          }

          // Skip common directories that shouldn't be scanned
          if (['node_modules', '.git', 'dist', 'build', 'out', '.vscode'].includes(entry.name)) {
            continue;
          }

          if (entry.isDirectory()) {
            const subPath = path.join(dirPath, entry.name);
            await scanDirectory(subPath, depth + 1);
          }
        }
      } catch (error: any) {
        // Handle permission errors gracefully
        if (error.code !== 'EACCES' && error.code !== 'EPERM') {
          console.debug(`Failed to scan directory ${dirPath}:`, error.message);
        }
      }
    };

    await scanDirectory(folderPath, 0);
    return repos;
  }

  async getGitConfig(repoPath: string): Promise<GitConfig | undefined> {
    try {
      const { execSync } = require('child_process');
      
      let name: string;
      let email: string;
      
      try {
        name = execSync('git config --local user.name', { 
          cwd: repoPath,
          encoding: 'utf-8',
          stdio: ['ignore', 'pipe', 'ignore']
        }).trim();
      } catch {
        // Try global config as fallback
        try {
          name = execSync('git config --global user.name', { 
            cwd: repoPath,
            encoding: 'utf-8',
            stdio: ['ignore', 'pipe', 'ignore']
          }).trim();
        } catch {
          return undefined;
        }
      }

      try {
        email = execSync('git config --local user.email', { 
          cwd: repoPath,
          encoding: 'utf-8',
          stdio: ['ignore', 'pipe', 'ignore']
        }).trim();
      } catch {
        // Try global config as fallback
        try {
          email = execSync('git config --global user.email', { 
            cwd: repoPath,
            encoding: 'utf-8',
            stdio: ['ignore', 'pipe', 'ignore']
          }).trim();
        } catch {
          return undefined;
        }
      }

      let sshCommand: string | undefined;
      try {
        sshCommand = execSync('git config --local core.sshCommand', { 
          cwd: repoPath,
          encoding: 'utf-8',
          stdio: ['ignore', 'pipe', 'ignore']
        }).trim() || undefined;
      } catch {
        // SSH command not set
      }

      return { name, email, sshCommand };
    } catch (error) {
      console.error('Failed to get Git config:', error);
      return undefined;
    }
  }

  async applyIdentity(repoPath: string, identity: { name: string; email: string; sshCommand?: string }): Promise<void> {
    try {
      const { execSync } = require('child_process');
      
      // Escape quotes in identity values
      const escapedName = identity.name.replace(/"/g, '\\"');
      const escapedEmail = identity.email.replace(/"/g, '\\"');
      
      execSync(`git config --local user.name "${escapedName}"`, { 
        cwd: repoPath,
        stdio: 'ignore'
      });

      execSync(`git config --local user.email "${escapedEmail}"`, { 
        cwd: repoPath,
        stdio: 'ignore'
      });

      if (identity.sshCommand) {
        const escapedSshCommand = identity.sshCommand.replace(/"/g, '\\"');
        execSync(`git config --local core.sshCommand "${escapedSshCommand}"`, { 
          cwd: repoPath,
          stdio: 'ignore'
        });
      } else {
        // Remove SSH command if not provided
        try {
          execSync('git config --local --unset core.sshCommand', { 
            cwd: repoPath,
            stdio: 'ignore'
          });
        } catch {
          // Config doesn't exist, ignore
        }
      }
    } catch (error: any) {
      console.error('Failed to apply identity:', error);
      const errorMessage = error?.message || String(error);
      throw new Error(`Failed to apply Git identity: ${errorMessage}`);
    }
  }

  async detectProvider(repoPath: string): Promise<GitProvider> {
    try {
      const { execSync } = require('child_process');
      let remotes: string;
      try {
        remotes = execSync('git remote -v', { 
          cwd: repoPath,
          encoding: 'utf-8',
          stdio: ['ignore', 'pipe', 'ignore']
        });
      } catch {
        // No remotes configured
        return 'unknown';
      }

      if (remotes.includes('github.com')) {
        return 'github';
      } else if (remotes.includes('gitlab.com')) {
        return 'gitlab';
      } else if (remotes.includes('bitbucket.org')) {
        return 'bitbucket';
      }

      return 'unknown';
    } catch {
      return 'unknown';
    }
  }

  async getPrimaryRemote(repoPath: string): Promise<string | undefined> {
    try {
      const { execSync } = require('child_process');
      const remote = execSync('git remote get-url origin', { 
        cwd: repoPath,
        encoding: 'utf-8',
        stdio: ['ignore', 'pipe', 'ignore']
      }).trim();
      return remote || undefined;
    } catch {
      return undefined;
    }
  }
}
