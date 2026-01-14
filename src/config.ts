import * as vscode from "vscode";

export const EXTENSION_ID = "gitswitch";

export const COMMANDS = {
  ADD_IDENTITY: "gitswitch.addIdentity",
  SWITCH_IDENTITY: "gitswitch.switchIdentity",
  BIND_REPO: "gitswitch.bindRepo",
  MANAGE_IDENTITIES: "gitswitch.manageIdentities",
} as const;

export const CONFIG_KEYS = {
  ENFORCE_IDENTITY: "gitswitch.enforceIdentity",
} as const;

export const STORAGE_KEYS = {
  IDENTITIES: "gitswitch.identities",
  REPO_BINDINGS: "gitswitch.repoBindings",
} as const;

export const SECRET_KEYS = {
  GITHUB_TOKEN_PREFIX: "gitswitch.githubToken.",
} as const;

export function getSecretKey(identityId: string): string {
  return `${SECRET_KEYS.GITHUB_TOKEN_PREFIX}${identityId}`;
}
