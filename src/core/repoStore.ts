import * as vscode from 'vscode';
import * as path from 'path';
import { RepoBinding } from './types';
import { STORAGE_KEYS } from '../config';

export class RepoStore {
  private context: vscode.ExtensionContext;
  private bindings: Map<string, RepoBinding> = new Map();

  constructor(context: vscode.ExtensionContext) {
    this.context = context;
  }

  async load(): Promise<void> {
    // Use globalState so repo bindings persist across workspaces
    const stored = this.context.globalState.get<RepoBinding[]>(STORAGE_KEYS.REPO_BINDINGS, []);
    this.bindings.clear();
    for (const binding of stored) {
      this.bindings.set(binding.repoPath, binding);
    }
  }

  async save(): Promise<void> {
    const bindings = Array.from(this.bindings.values());
    // Use globalState so repo bindings persist across workspaces
    await this.context.globalState.update(STORAGE_KEYS.REPO_BINDINGS, bindings);
  }

  async getBinding(repoPath: string): Promise<RepoBinding | undefined> {
    // Normalize path for consistent lookups
    const normalizedPath = this.normalizePath(repoPath);
    return this.bindings.get(normalizedPath);
  }

  async setBinding(repoPath: string, identityId: string, enforced: boolean = false): Promise<RepoBinding> {
    const normalizedPath = this.normalizePath(repoPath);
    const binding: RepoBinding = {
      repoPath: normalizedPath,
      identityId,
      enforced,
    };
    this.bindings.set(normalizedPath, binding);
    await this.save();
    return binding;
  }

  async removeBinding(repoPath: string): Promise<void> {
    const normalizedPath = this.normalizePath(repoPath);
    this.bindings.delete(normalizedPath);
    await this.save();
  }

  async getAllBindings(): Promise<RepoBinding[]> {
    return Array.from(this.bindings.values());
  }

  async getBindingsForIdentity(identityId: string): Promise<RepoBinding[]> {
    return Array.from(this.bindings.values()).filter(b => b.identityId === identityId);
  }

  private normalizePath(repoPath: string): string {
    // Normalize to absolute path for consistent storage
    return path.resolve(repoPath);
  }

  async findRepoPath(gitRoot: string): Promise<string | undefined> {
    // Try to find a binding that matches this git root
    const normalizedGitRoot = this.normalizePath(gitRoot);
    
    // Check exact match first
    if (this.bindings.has(normalizedGitRoot)) {
      return normalizedGitRoot;
    }

    // Check if any binding path is a parent or matches
    for (const [storedPath] of this.bindings) {
      if (normalizedGitRoot === storedPath || normalizedGitRoot.startsWith(storedPath + path.sep)) {
        return storedPath;
      }
    }

    return undefined;
  }
}
