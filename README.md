# GitSwitch 🔄

> **Never accidentally commit from the wrong GitHub account again.**

GitSwitch automatically manages Git identities per repository, preventing accidental commits from the wrong GitHub account. Seamlessly switch between multiple Git identities with a beautiful, intuitive interface.

## ✨ Features

- **🔄 Multiple Identity Management**: Store and manage multiple Git identities (name, email, SSH keys)
- **🔗 Automatic Repository Binding**: Automatically detect and bind repositories to identities
- **⚡ Quick Identity Switching**: Switch between identities with a single click from the status bar
- **🛡️ Mismatch Detection**: Automatically detect when a repository's Git config doesn't match the bound identity
- **🔐 SSH Key Management**: Automatically configure SSH keys per repository
- **📊 Status Bar Integration**: See your current identity at a glance in the status bar
- **🎨 Beautiful UI**: Modern, intuitive interface with step-by-step guides

## 🚀 Installation

### From VS Code Marketplace

1. Open VS Code
2. Go to Extensions (`Ctrl+Shift+X` / `Cmd+Shift+X`)
3. Search for "GitSwitch"
4. Click "Install"

### From Source

1. Clone this repository
2. Run `npm install` to install dependencies
3. Press `F5` in VS Code to open a new window with the extension loaded
4. Or package the extension: `npm run package` and install the `.vsix` file

## 📖 Usage

### Adding an Identity

1. Open the Command Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`)
2. Run `GitSwitch: Add Identity` or `GitSwitch: Manage Identities`
3. Fill in the identity details:
   - **Label**: A friendly name (e.g., "Work Account", "Personal")
   - **Name**: Your Git name
   - **Email**: Your Git email
   - **SSH Key Path**: Path to your SSH key (e.g., `~/.ssh/id_ed25519`)
   - **GitHub Username**: (Optional) Your GitHub username
4. Click "SSH Setup Guide" if you need help setting up SSH keys

### Setting Up SSH Keys

If you don't have an SSH key yet:

1. **Generate a new SSH key:**
   ```bash
   ssh-keygen -t ed25519 -C "your_email@example.com" -f ~/.ssh/id_ed25519_accountname
   ```

2. **Copy your public key:**
   ```bash
   cat ~/.ssh/id_ed25519_accountname.pub
   ```

3. **Add to GitHub:**
   - Go to GitHub → Settings → SSH and GPG keys
   - Click "New SSH key"
   - Paste your public key
   - Click "Add SSH key"

4. **Use the private key path in GitSwitch:**
   - Enter `~/.ssh/id_ed25519_accountname` in the SSH Key Path field

### Binding a Repository

1. Open a Git repository in VS Code
2. Open the Command Palette
3. Run `GitSwitch: Bind Repository to Identity`
4. Select the identity to bind

The extension will automatically apply the identity's Git config and SSH key to the repository.

### Switching Identities

- **Click on the status bar indicator** showing your current identity
- Or use the Command Palette: `GitSwitch: Switch Identity`

### Managing Identities

- Use `GitSwitch: Manage Identities` to open the identity management webview
- Edit or delete identities as needed
- All identities are stored globally and persist across workspaces

## 🎯 How It Works

1. **On Extension Activation**: The extension scans all workspace folders for Git repositories
2. **On Repository Open**: The extension checks if a binding exists and applies the identity
3. **On Mismatch Detection**: If the Git config doesn't match the bound identity, you'll be prompted to switch
4. **On Identity Switch**: The extension updates the repository's Git config and SSH command automatically

## ⚙️ Configuration

The extension stores identities and repository bindings globally (persists across all workspaces). GitHub tokens (if provided) are encrypted using VS Code's SecretStorage API.

### Settings

- `gitswitch.enforceIdentity`: Enforce identity matching before commits (default: `false`)

## 🎨 Screenshots

*Add screenshots of your extension here*

## 📝 Commands

- `gitswitch.addIdentity` - Add a new identity
- `gitswitch.switchIdentity` - Switch the current repository's identity
- `gitswitch.bindRepo` - Bind the current repository to an identity
- `gitswitch.manageIdentities` - Open the identity management webview

## 🔧 Requirements

- VS Code 1.74.0 or higher
- Git installed and available in PATH
- VS Code Git extension (usually pre-installed)

## 🛠️ Development

```bash
# Install dependencies
npm install

# Compile TypeScript
npm run compile

# Build webview
npm run webpack

# Build both
npm run compile:all

# Watch for changes
npm run watch

# Package extension
npm run package
```

## 📄 License

MIT

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📮 Support

- **Issues**: [GitHub Issues](https://github.com/yourusername/gitswitch/issues)
- **Documentation**: See [PUBLISHING_GUIDE.md](./PUBLISHING_GUIDE.md) for publishing instructions

## 🙏 Acknowledgments

Built with ❤️ for developers who work with multiple Git accounts.

---

**Made with 🔄 GitSwitch** - Never commit from the wrong account again!
