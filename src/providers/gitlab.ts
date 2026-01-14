import { GitProvider } from '../core/types';

export function detectGitLabRemote(remoteUrl: string): boolean {
  return remoteUrl.includes('gitlab.com');
}

export function extractGitLabUsername(remoteUrl: string): string | undefined {
  const match = remoteUrl.match(/gitlab\.com[/:]([^/]+)/);
  return match ? match[1] : undefined;
}
