import { GitProvider } from '../core/types';

export function detectBitbucketRemote(remoteUrl: string): boolean {
  return remoteUrl.includes('bitbucket.org');
}

export function extractBitbucketUsername(remoteUrl: string): string | undefined {
  const match = remoteUrl.match(/bitbucket\.org[/:]([^/]+)/);
  return match ? match[1] : undefined;
}
