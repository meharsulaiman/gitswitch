import * as vscode from "vscode";
import { IdentityStore } from "./core/identityStore";
import { RepoStore } from "./core/repoStore";
import { GitService } from "./core/gitService";
import { SshService } from "./core/sshService";
import { MultiRepoManager } from "./core/multiRepoManager";
import { WorkspaceWatcher } from "./watchers/workspaceWatcher";
import { RepoWatcher } from "./watchers/repoWatcher";
import { StatusBar } from "./ui/statusBar";
import { IdentityPicker } from "./ui/identityPicker";
import { WebviewManager } from "./ui/webviewManager";
import { RepoPanel } from "./ui/repoPanel";
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

  // Initialize multi-repo manager
  const multiRepoManager = new MultiRepoManager(gitService, repoStore, identityStore);

  // Initialize UI components
  const identityPicker = new IdentityPicker(identityStore);
  const webviewManager = new WebviewManager(context, identityStore);
  const repoPanel = new RepoPanel(context, multiRepoManager, identityStore, gitService, sshService, repoStore);
  statusBar = new StatusBar(identityStore, repoStore, gitService, multiRepoManager);

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
    sshService,
    repoPanel
  );
  commandDisposables.forEach((d) => context.subscriptions.push(d));

  // Scan current workspace folders for all repos
  const folders = vscode.workspace.workspaceFolders || [];
  for (const folder of folders) {
    try {
      // Scan for all repos (including nested ones)
      const allRepos = await gitService.findAllGitRepos(folder.uri.fsPath);
      
      // Also check if root is a repo
      const rootRepo = await gitService.findGitRoot(folder.uri.fsPath);
      if (rootRepo === folder.uri.fsPath && !allRepos.includes(rootRepo)) {
        allRepos.unshift(rootRepo);
      }

      for (const repoPath of allRepos) {
        await repoWatcher.watchRepo(repoPath, folder);
      }

      // Update status bar based on active editor
      const activeEditor = vscode.window.activeTextEditor;
      if (activeEditor && activeEditor.document.uri.scheme === 'file') {
        await statusBar?.update();
      } else if (allRepos.length > 0) {
        // Fallback to first repo if no active editor
        await statusBar?.update(allRepos[0]);
      }
    } catch (error: any) {
      // Handle errors gracefully for individual folders
      console.error(`Failed to scan folder ${folder.uri.fsPath}:`, error);
    }
  }

  // Watch for active editor changes to update status bar
  context.subscriptions.push(
    vscode.window.onDidChangeActiveTextEditor(async () => {
      // StatusBar.update() will auto-detect repo from active file
      await statusBar?.update();
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
