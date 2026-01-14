export interface Identity {
  id: string;
  label: string;
  name: string;
  email: string;
  sshKeyPath: string;
  githubUsername?: string;
}

export interface RepoBinding {
  repoPath: string;
  identityId: string;
  enforced: boolean;
}

export interface GitConfig {
  name: string;
  email: string;
  sshCommand?: string;
}

export type GitProvider = 'github' | 'gitlab' | 'bitbucket' | 'unknown';
