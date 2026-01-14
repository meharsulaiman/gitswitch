import * as vscode from "vscode";
import { IdentityStore } from "./core/identityStore";
import { RepoStore } from "./core/repoStore";
import { GitService } from "./core/gitService";
import { SshService } from "./core/sshService";
import { WorkspaceWatcher } from "./watchers/workspaceWatcher";
import { RepoWatcher } from "./watchers/repoWatcher";
import { StatusBar } from "./ui/statusBar";
import { IdentityPicker } from "./ui/identityPicker";
import { WebviewManager } from "./ui/webviewManager";
import { MismatchDetector } from "./core/mismatchDetector";
import { registerAllCommands } from "./commands";

let workspaceWatcher: WorkspaceWatcher | undefined;
let repoWatcher: RepoWatcher | undefined;
let statusBar: StatusBar | undefined;
let currentRepoPath: string | undefined;

export async function activate(context: vscode.ExtensionContext) {
  console.log("GitSwitch extension is now active!");

  // Initialize core services
  const identityStore = new IdentityStore(context);
  await identityStore.load();

  const repoStore = new RepoStore(context);
  await repoStore.load();

  const gitService = new GitService();

  // Check if Git extension is available
  if (!gitService["gitApi"]) {
    vscode.window.showWarningMessage(
      "GitSwitch: Git extension not found. Some features may not work.",
      "Dismiss"
    );
  }

  const sshService = new SshService();

  // Initialize UI components
  statusBar = new StatusBar(identityStore, repoStore, gitService);
  const identityPicker = new IdentityPicker(identityStore);
  const webviewManager = new WebviewManager(context, identityStore);

  // Initialize mismatch detector
  const mismatchDetector = new MismatchDetector(
    gitService,
    repoStore,
    identityStore
  );

  // Handle mismatch callback
  const handleMismatch = async (
    repoPath: string,
    currentConfig: { name: string; email: string },
    expectedIdentity: { name: string; email: string }
  ) => {
    const mismatch = await mismatchDetector.detectMismatch(repoPath);
    if (mismatch.hasMismatch) {
      const action = await mismatchDetector.showMismatchPrompt(mismatch);

      if (action === "switch") {
        // Show identity picker and apply selected identity
        const selected = await identityPicker.showQuickPick();
        if (selected) {
          const identity = await identityStore.get(selected.id);
          if (identity) {
            try {
              const sshCommand = sshService.generateSshCommand(
                identity.sshKeyPath
              );
              await gitService.applyIdentity(repoPath, {
                name: identity.name,
                email: identity.email,
                sshCommand,
              });
              await repoStore.setBinding(repoPath, identity.id, false);
              await statusBar?.update(repoPath);
              vscode.window.showInformationMessage(
                `Switched to identity: ${identity.label}`
              );
            } catch (error: any) {
              vscode.window.showErrorMessage(
                `Failed to switch identity: ${error.message}`
              );
            }
          }
        }
      } else if (action === "override") {
        // Update binding to match current config
        const identities = await identityStore.getAll();
        const matchingIdentity = identities.find(
          (id) => id.email === currentConfig.email
        );
        if (matchingIdentity) {
          await repoStore.setBinding(repoPath, matchingIdentity.id, false);
          await statusBar?.update(repoPath);
        }
      }
    }
  };

  // Initialize watchers
  repoWatcher = new RepoWatcher(
    gitService,
    repoStore,
    identityStore,
    sshService,
    handleMismatch
  );

  workspaceWatcher = new WorkspaceWatcher(
    gitService,
    async (repoPath, workspaceFolder) => {
      currentRepoPath = repoPath;
      await repoWatcher!.watchRepo(repoPath, workspaceFolder);
      await statusBar?.update(repoPath);
    }
  );

  workspaceWatcher.start();

  // Register commands
  const commandDisposables = registerAllCommands(
    context,
    webviewManager,
    identityPicker,
    identityStore,
    repoStore,
    gitService,
    sshService
  );
  commandDisposables.forEach((d) => context.subscriptions.push(d));

  // Scan current workspace folders
  const folders = vscode.workspace.workspaceFolders || [];
  for (const folder of folders) {
    try {
      const repoPath = await gitService.findGitRoot(folder.uri.fsPath);
      if (repoPath) {
        currentRepoPath = repoPath;
        await repoWatcher.watchRepo(repoPath, folder);
        await statusBar.update(repoPath);
      }
    } catch (error: any) {
      // Handle errors gracefully for individual folders
      console.error(`Failed to scan folder ${folder.uri.fsPath}:`, error);
    }
  }

  // Watch for active editor changes to update status bar
  context.subscriptions.push(
    vscode.window.onDidChangeActiveTextEditor(async () => {
      if (currentRepoPath) {
        await statusBar?.update(currentRepoPath);
      }
    })
  );

  // Watch for workspace folder changes
  context.subscriptions.push(workspaceWatcher);

  console.log("GitSwitch extension initialized successfully");
}

export function deactivate() {
  workspaceWatcher?.dispose();
  repoWatcher?.dispose();
  statusBar?.dispose();
}
