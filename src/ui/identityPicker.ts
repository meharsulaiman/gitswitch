import * as vscode from 'vscode';
import { IdentityStore } from '../core/identityStore';
import { COMMANDS } from '../config';

export class IdentityPicker {
  private identityStore: IdentityStore;

  constructor(identityStore: IdentityStore) {
    this.identityStore = identityStore;
  }

  async showQuickPick(): Promise<{ id: string; label: string } | undefined> {
    const identities = await this.identityStore.getAll();

    if (identities.length === 0) {
      const action = await vscode.window.showInformationMessage(
        'No identities configured. Would you like to add one?',
        'Add Identity'
      );
      if (action === 'Add Identity') {
        await vscode.commands.executeCommand(COMMANDS.ADD_IDENTITY);
      }
      return undefined;
    }

    const items: vscode.QuickPickItem[] = identities.map(identity => ({
      label: identity.label,
      description: `${identity.name} <${identity.email}>`,
      detail: identity.sshKeyPath,
    }));

    items.push({
      label: '$(plus) Add New Identity',
      alwaysShow: true,
    });

    const selected = await vscode.window.showQuickPick(items, {
      placeHolder: 'Select a Git identity',
    });

    if (!selected) {
      return undefined;
    }

    if (selected.label === '$(plus) Add New Identity') {
      await vscode.commands.executeCommand(COMMANDS.ADD_IDENTITY);
      return undefined;
    }

    const selectedIdentity = identities.find(id => 
      id.label === selected.label && id.email === selected.description?.match(/<(.+)>/)?.[1]
    );

    if (!selectedIdentity) {
      return undefined;
    }

    return {
      id: selectedIdentity.id,
      label: selectedIdentity.label,
    };
  }
}
