import { GitProvider } from '../core/types';

export function detectGitHubRemote(remoteUrl: string): boolean {
  return remoteUrl.includes('github.com');
}

export function extractGitHubUsername(remoteUrl: string): string | undefined {
  const match = remoteUrl.match(/github\.com[/:]([^/]+)/);
  return match ? match[1] : undefined;
}
