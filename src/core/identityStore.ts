import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { Identity } from './types';
import { STORAGE_KEYS, SECRET_KEYS, getSecretKey } from '../config';

export class IdentityStore {
  private context: vscode.ExtensionContext;
  private identities: Map<string, Identity> = new Map();

  constructor(context: vscode.ExtensionContext) {
    this.context = context;
  }

  async load(): Promise<void> {
    // Use globalState instead of workspaceState so identities persist across workspaces
    const stored = this.context.globalState.get<Identity[]>(STORAGE_KEYS.IDENTITIES, []);
    this.identities.clear();
    for (const identity of stored) {
      this.identities.set(identity.id, identity);
    }
  }

  async save(): Promise<void> {
    const identities = Array.from(this.identities.values());
    // Use globalState instead of workspaceState so identities persist across workspaces
    await this.context.globalState.update(STORAGE_KEYS.IDENTITIES, identities);
  }

  async getAll(): Promise<Identity[]> {
    return Array.from(this.identities.values());
  }

  async get(id: string): Promise<Identity | undefined> {
    return this.identities.get(id);
  }

  async add(identity: Omit<Identity, 'id'>): Promise<Identity> {
    const id = this.generateId();
    const newIdentity: Identity = { ...identity, id };
    
    // Validate email format
    if (!this.isValidEmail(identity.email)) {
      throw new Error('Invalid email format');
    }

    // Validate SSH key path is provided
    if (!identity.sshKeyPath || identity.sshKeyPath.trim() === '') {
      throw new Error('SSH key path is required');
    }

    // Check if user pasted key content instead of path
    if (identity.sshKeyPath.includes('BEGIN') || identity.sshKeyPath.includes('PRIVATE KEY')) {
      throw new Error('Please provide the SSH key file path (e.g., ~/.ssh/id_ed25519), not the key content');
    }

    // Validate SSH key exists
    if (!await this.validateSshKey(identity.sshKeyPath)) {
      throw new Error(`SSH key not found: ${identity.sshKeyPath}. Please check the path is correct.`);
    }

    this.identities.set(id, newIdentity);
    await this.save();
    return newIdentity;
  }

  async update(id: string, updates: Partial<Omit<Identity, 'id'>>): Promise<Identity> {
    const existing = this.identities.get(id);
    if (!existing) {
      throw new Error(`Identity not found: ${id}`);
    }

    const updated: Identity = { ...existing, ...updates };

    // Validate email if changed
    if (updates.email && !this.isValidEmail(updated.email)) {
      throw new Error('Invalid email format');
    }

    // Validate SSH key if changed
    if (updates.sshKeyPath && !await this.validateSshKey(updated.sshKeyPath)) {
      throw new Error(`SSH key not found: ${updated.sshKeyPath}`);
    }

    this.identities.set(id, updated);
    await this.save();
    return updated;
  }

  async delete(id: string): Promise<void> {
    if (!this.identities.has(id)) {
      throw new Error(`Identity not found: ${id}`);
    }

    // Delete associated GitHub token from secret storage
    const secretKey = getSecretKey(id);
    await this.context.secrets.delete(secretKey);

    this.identities.delete(id);
    await this.save();
  }

  async setGitHubToken(identityId: string, token: string): Promise<void> {
    if (!this.identities.has(identityId)) {
      throw new Error(`Identity not found: ${identityId}`);
    }

    const secretKey = getSecretKey(identityId);
    await this.context.secrets.store(secretKey, token);
  }

  async getGitHubToken(identityId: string): Promise<string | undefined> {
    const secretKey = getSecretKey(identityId);
    return await this.context.secrets.get(secretKey);
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private async validateSshKey(sshKeyPath: string): Promise<boolean> {
    try {
      const resolvedPath = this.resolvePath(sshKeyPath);
      const stats = await fs.promises.stat(resolvedPath);
      return stats.isFile();
    } catch {
      return false;
    }
  }

  private resolvePath(filePath: string): string {
    if (filePath.startsWith('~')) {
      const homeDir = process.env.HOME || process.env.USERPROFILE || '';
      return path.join(homeDir, filePath.slice(1));
    }
    return path.resolve(filePath);
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
