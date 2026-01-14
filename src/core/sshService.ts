import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';

export class SshService {
  /**
   * Validates that an SSH key file exists
   */
  async validateSshKey(sshKeyPath: string): Promise<boolean> {
    try {
      const resolvedPath = this.resolvePath(sshKeyPath);
      const stats = await fs.promises.stat(resolvedPath);
      return stats.isFile();
    } catch {
      return false;
    }
  }

  /**
   * Generates the SSH command for Git config
   * Format: ssh -i <keyPath> -F /dev/null
   */
  generateSshCommand(sshKeyPath: string): string {
    const resolvedPath = this.resolvePath(sshKeyPath);
    const normalizedPath = this.normalizePathForSsh(resolvedPath);
    return `ssh -i "${normalizedPath}" -F /dev/null`;
  }

  /**
   * Resolves a path, handling tilde expansion and relative paths
   */
  private resolvePath(filePath: string): string {
    if (filePath.startsWith('~')) {
      const homeDir = os.homedir();
      return path.join(homeDir, filePath.slice(1));
    }
    return path.resolve(filePath);
  }

  /**
   * Normalizes a path for use in SSH command
   * On Windows, converts backslashes to forward slashes
   */
  private normalizePathForSsh(filePath: string): string {
    if (process.platform === 'win32') {
      // Convert Windows path separators to forward slashes for SSH
      return filePath.replace(/\\/g, '/');
    }
    return filePath;
  }

  /**
   * Checks if an SSH key path is valid and accessible
   */
  async checkSshKeyAccess(sshKeyPath: string): Promise<{ valid: boolean; error?: string }> {
    try {
      const resolvedPath = this.resolvePath(sshKeyPath);
      const stats = await fs.promises.stat(resolvedPath);
      
      if (!stats.isFile()) {
        return { valid: false, error: 'Path is not a file' };
      }

      // Check read permissions
      await fs.promises.access(resolvedPath, fs.constants.R_OK);
      
      return { valid: true };
    } catch (error: any) {
      return { valid: false, error: error.message || 'Cannot access SSH key file' };
    }
  }
}
