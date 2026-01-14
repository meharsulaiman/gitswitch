import * as React from 'react';
import * as ReactDOM from 'react-dom/client';

interface Identity {
  id: string;
  label: string;
  name: string;
  email: string;
  sshKeyPath: string;
  githubUsername?: string;
}

interface WebviewMessage {
  type: 'load' | 'save' | 'delete' | 'getToken' | 'setToken' | 'update' | 'add' | 'error';
  payload?: any;
}

// Declare VS Code API
declare function acquireVsCodeApi(): {
  postMessage: (message: any) => void;
  getState: () => any;
  setState: (state: any) => void;
};

// Acquire VS Code API
const vscode = acquireVsCodeApi();

const App: React.FC = () => {
  const [identities, setIdentities] = React.useState<Identity[]>([]);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [formData, setFormData] = React.useState<Partial<Identity>>({});
  const [isLoading, setIsLoading] = React.useState<boolean>(true);
  const [showSshGuide, setShowSshGuide] = React.useState<boolean>(false);

  React.useEffect(() => {
    console.log('Webview: Setting up message listener');
    
    // Listen for messages from extension
    const handleMessage = (event: MessageEvent) => {
      console.log('Webview: Received message', event.data);
      const message: WebviewMessage = event.data;
      if (message.type === 'load') {
        console.log('Webview: Loading identities', message.payload);
        const identitiesList = message.payload || [];
        console.log('Webview: Setting identities state', identitiesList);
        setIdentities(identitiesList);
        setIsLoading(false);
      } else if (message.type === 'error') {
        console.error('Webview: Error from extension', message.payload);
        setIsLoading(false);
        alert('Error: ' + message.payload);
      }
    };

    window.addEventListener('message', handleMessage);
    console.log('Webview: Message listener added');

    // Request initial data after a short delay to ensure listener is ready
    setTimeout(() => {
      try {
        console.log('Webview: Requesting initial data');
        vscode.postMessage({ type: 'load' });
        console.log('Webview: Initial load message sent');
      } catch (error) {
        console.error('Webview: Failed to send initial message', error);
      }
    }, 100);

    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, []);

  const handleSave = () => {
    if (!formData.label || !formData.name || !formData.email || !formData.sshKeyPath) {
      vscode.postMessage({
        type: 'error',
        payload: 'Please fill in all required fields',
      });
      return;
    }

    vscode.postMessage({
      type: editingId ? 'update' : 'add',
      payload: editingId ? { ...formData, id: editingId } : formData,
    });

    setFormData({});
    setEditingId(null);
  };

  const handleEdit = (identity: Identity) => {
    setFormData(identity);
    setEditingId(identity.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this identity?')) {
      vscode.postMessage({ type: 'delete', payload: { id } });
    }
  };

  if (isLoading) {
    return (
      <div style={styles.container}>
        <div style={styles.loadingContainer}>
          <div style={styles.spinner}></div>
          <p style={styles.loadingText}>Loading identities...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerContent}>
          <h1 style={styles.title}>
            <span style={styles.icon}>🔄</span> GitSwitch
          </h1>
          <p style={styles.subtitle}>Manage your Git identities seamlessly</p>
        </div>
      </div>

      {/* Main Content */}
      <div style={styles.content}>
        {/* Add/Edit Identity Form */}
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <h2 style={styles.cardTitle}>
              {editingId ? '✏️ Edit Identity' : '➕ Add New Identity'}
            </h2>
            {!editingId && (
              <button
                onClick={() => setShowSshGuide(!showSshGuide)}
                style={styles.helpButton}
                title="Show SSH Key Setup Guide"
              >
                {showSshGuide ? '❌ Hide Guide' : '❓ SSH Setup Guide'}
              </button>
            )}
          </div>

          {/* SSH Setup Guide */}
          {showSshGuide && !editingId && (
            <div style={styles.guide}>
              <h3 style={styles.guideTitle}>📚 SSH Key Setup Guide</h3>
              <div style={styles.guideSteps}>
                <div style={styles.step}>
                  <div style={styles.stepNumber}>1</div>
                  <div style={styles.stepContent}>
                    <strong>Check if you have an SSH key:</strong>
                    <code style={styles.code}>ls ~/.ssh</code>
                    <p style={styles.stepDescription}>
                      Look for files like <code>id_ed25519</code> or <code>id_rsa</code>
                    </p>
                  </div>
                </div>
                <div style={styles.step}>
                  <div style={styles.stepNumber}>2</div>
                  <div style={styles.stepContent}>
                    <strong>Generate a new SSH key (if needed):</strong>
                    <code style={styles.code}>
                      ssh-keygen -t ed25519 -C "your_email@example.com" -f ~/.ssh/id_ed25519_accountname
                    </code>
                    <p style={styles.stepDescription}>
                      Replace <code>accountname</code> with a unique identifier for this account
                    </p>
                  </div>
                </div>
                <div style={styles.step}>
                  <div style={styles.stepNumber}>3</div>
                  <div style={styles.stepContent}>
                    <strong>Copy your public key:</strong>
                    <code style={styles.code}>cat ~/.ssh/id_ed25519_accountname.pub</code>
                    <p style={styles.stepDescription}>
                      Copy the entire output (starts with <code>ssh-ed25519</code>)
                    </p>
                  </div>
                </div>
                <div style={styles.step}>
                  <div style={styles.stepNumber}>4</div>
                  <div style={styles.stepContent}>
                    <strong>Add to GitHub:</strong>
                    <ol style={styles.stepList}>
                      <li>Go to GitHub → Settings → SSH and GPG keys</li>
                      <li>Click "New SSH key"</li>
                      <li>Paste your public key</li>
                      <li>Click "Add SSH key"</li>
                    </ol>
                  </div>
                </div>
                <div style={styles.step}>
                  <div style={styles.stepNumber}>5</div>
                  <div style={styles.stepContent}>
                    <strong>Use the private key path in the form below:</strong>
                    <code style={styles.code}>~/.ssh/id_ed25519_accountname</code>
                    <p style={styles.stepDescription}>
                      <strong>Important:</strong> Use the file path, NOT the key content!
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div style={styles.form}>
            <div style={styles.formGroup}>
              <label style={styles.label}>
                Label <span style={styles.required}>*</span>
              </label>
              <input
                type="text"
                placeholder="e.g., Work Account, Personal, Company A"
                value={formData.label || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, label: e.target.value })}
                style={styles.input}
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>
                Name <span style={styles.required}>*</span>
              </label>
              <input
                type="text"
                placeholder="Your full name"
                value={formData.name || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, name: e.target.value })}
                style={styles.input}
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>
                Email <span style={styles.required}>*</span>
              </label>
              <input
                type="email"
                placeholder="your.email@example.com"
                value={formData.email || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, email: e.target.value })}
                style={styles.input}
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>
                SSH Key Path <span style={styles.required}>*</span>
                <span style={styles.helpText}> (e.g., ~/.ssh/id_ed25519)</span>
              </label>
              <input
                type="text"
                placeholder="~/.ssh/id_ed25519"
                value={formData.sshKeyPath || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, sshKeyPath: e.target.value })}
                style={styles.input}
              />
              <p style={styles.hint}>
                💡 Use the file path, not the key content. Click "SSH Setup Guide" above for help.
              </p>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>GitHub Username (optional)</label>
              <input
                type="text"
                placeholder="your-github-username"
                value={formData.githubUsername || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, githubUsername: e.target.value })}
                style={styles.input}
              />
            </div>

            <div style={styles.formActions}>
              <button onClick={handleSave} style={styles.primaryButton}>
                {editingId ? '💾 Update Identity' : '➕ Add Identity'}
              </button>
              {editingId && (
                <button onClick={() => { setFormData({}); setEditingId(null); }} style={styles.secondaryButton}>
                  Cancel
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Identities List */}
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <h2 style={styles.cardTitle}>
              👥 Your Identities ({identities.length})
            </h2>
          </div>

          {identities.length === 0 ? (
            <div style={styles.emptyState}>
              <div style={styles.emptyIcon}>👤</div>
              <p style={styles.emptyText}>No identities configured yet.</p>
              <p style={styles.emptySubtext}>Add your first identity above to get started!</p>
            </div>
          ) : (
            <div style={styles.identitiesList}>
              {identities.map((identity) => (
                <div key={identity.id} style={styles.identityCard}>
                  <div style={styles.identityHeader}>
                    <div style={styles.identityInfo}>
                      <h3 style={styles.identityLabel}>{identity.label}</h3>
                      <p style={styles.identityEmail}>{identity.email}</p>
                      {identity.githubUsername && (
                        <p style={styles.identityUsername}>@{identity.githubUsername}</p>
                      )}
                    </div>
                    <div style={styles.identityActions}>
                      <button
                        onClick={() => handleEdit(identity)}
                        style={styles.editButton}
                        title="Edit identity"
                      >
                        ✏️ Edit
                      </button>
                      <button
                        onClick={() => handleDelete(identity.id)}
                        style={styles.deleteButton}
                        title="Delete identity"
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </div>
                  <div style={styles.identityDetails}>
                    <div style={styles.detailItem}>
                      <strong>Name:</strong> {identity.name}
                    </div>
                    <div style={styles.detailItem}>
                      <strong>SSH Key:</strong>
                      <code style={styles.sshPath}>{identity.sshKeyPath}</code>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Styles
const styles = {
  container: {
    padding: '0',
    fontFamily: 'var(--vscode-font-family)',
    color: 'var(--vscode-foreground)',
    backgroundColor: 'var(--vscode-editor-background)',
    minHeight: '100vh',
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    padding: '60px 20px',
  },
  spinner: {
    width: '40px',
    height: '40px',
    border: '4px solid var(--vscode-input-border)',
    borderTop: '4px solid var(--vscode-textLink-foreground)',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  loadingText: {
    marginTop: '20px',
    color: 'var(--vscode-descriptionForeground)',
  },
  header: {
    background: 'linear-gradient(135deg, var(--vscode-button-background) 0%, var(--vscode-button-hoverBackground) 100%)',
    padding: '24px',
    borderBottom: '1px solid var(--vscode-panel-border)',
  },
  headerContent: {
    maxWidth: '1200px',
    margin: '0 auto',
  },
  title: {
    margin: '0 0 8px 0',
    fontSize: '28px',
    fontWeight: 'bold',
    color: 'var(--vscode-button-foreground)',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  icon: {
    fontSize: '32px',
  },
  subtitle: {
    margin: '0',
    fontSize: '14px',
    color: 'var(--vscode-button-foreground)',
    opacity: 0.9,
  },
  content: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '24px',
  },
  card: {
    backgroundColor: 'var(--vscode-editor-background)',
    border: '1px solid var(--vscode-panel-border)',
    borderRadius: '8px',
    padding: '24px',
    marginBottom: '24px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
    paddingBottom: '16px',
    borderBottom: '1px solid var(--vscode-panel-border)',
  },
  cardTitle: {
    margin: '0',
    fontSize: '20px',
    fontWeight: '600',
  },
  helpButton: {
    padding: '6px 12px',
    backgroundColor: 'var(--vscode-button-secondaryBackground)',
    color: 'var(--vscode-button-secondaryForeground)',
    border: '1px solid var(--vscode-button-border)',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '12px',
  },
  guide: {
    backgroundColor: 'var(--vscode-textBlockQuote-background)',
    border: '1px solid var(--vscode-textBlockQuote-border)',
    borderRadius: '6px',
    padding: '20px',
    marginBottom: '20px',
  },
  guideTitle: {
    margin: '0 0 16px 0',
    fontSize: '16px',
    fontWeight: '600',
  },
  guideSteps: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '16px',
  },
  step: {
    display: 'flex',
    gap: '16px',
  },
  stepNumber: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    backgroundColor: 'var(--vscode-button-background)',
    color: 'var(--vscode-button-foreground)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 'bold',
    flexShrink: 0,
  },
  stepContent: {
    flex: 1,
  },
  stepDescription: {
    margin: '8px 0 0 0',
    fontSize: '13px',
    color: 'var(--vscode-descriptionForeground)',
  },
  stepList: {
    margin: '8px 0',
    paddingLeft: '20px',
  },
  code: {
    backgroundColor: 'var(--vscode-textCodeBlock-background)',
    padding: '2px 6px',
    borderRadius: '3px',
    fontFamily: 'var(--vscode-editor-font-family)',
    fontSize: '12px',
    display: 'block',
    margin: '8px 0',
  },
  form: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '20px',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '8px',
  },
  label: {
    fontSize: '14px',
    fontWeight: '500',
    color: 'var(--vscode-foreground)',
  },
  required: {
    color: 'var(--vscode-errorForeground)',
  },
  helpText: {
    fontSize: '12px',
    color: 'var(--vscode-descriptionForeground)',
    fontWeight: 'normal',
  },
  input: {
    padding: '10px 12px',
    backgroundColor: 'var(--vscode-input-background)',
    color: 'var(--vscode-input-foreground)',
    border: '1px solid var(--vscode-input-border)',
    borderRadius: '4px',
    fontSize: '14px',
    fontFamily: 'var(--vscode-font-family)',
  },
  hint: {
    margin: '4px 0 0 0',
    fontSize: '12px',
    color: 'var(--vscode-descriptionForeground)',
    fontStyle: 'italic',
  },
  formActions: {
    display: 'flex',
    gap: '12px',
    marginTop: '8px',
  },
  primaryButton: {
    padding: '10px 20px',
    backgroundColor: 'var(--vscode-button-background)',
    color: 'var(--vscode-button-foreground)',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
  },
  secondaryButton: {
    padding: '10px 20px',
    backgroundColor: 'var(--vscode-button-secondaryBackground)',
    color: 'var(--vscode-button-secondaryForeground)',
    border: '1px solid var(--vscode-button-border)',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
  },
  emptyState: {
    textAlign: 'center' as const,
    padding: '60px 20px',
  },
  emptyIcon: {
    fontSize: '64px',
    marginBottom: '16px',
  },
  emptyText: {
    fontSize: '16px',
    fontWeight: '500',
    margin: '0 0 8px 0',
  },
  emptySubtext: {
    fontSize: '14px',
    color: 'var(--vscode-descriptionForeground)',
    margin: '0',
  },
  identitiesList: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '16px',
  },
  identityCard: {
    border: '1px solid var(--vscode-panel-border)',
    borderRadius: '6px',
    padding: '16px',
    backgroundColor: 'var(--vscode-editor-background)',
  },
  identityHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '12px',
  },
  identityInfo: {
    flex: 1,
  },
  identityLabel: {
    margin: '0 0 4px 0',
    fontSize: '16px',
    fontWeight: '600',
  },
  identityEmail: {
    margin: '0 0 4px 0',
    fontSize: '14px',
    color: 'var(--vscode-descriptionForeground)',
  },
  identityUsername: {
    margin: '0',
    fontSize: '13px',
    color: 'var(--vscode-textLink-foreground)',
  },
  identityActions: {
    display: 'flex',
    gap: '8px',
  },
  editButton: {
    padding: '6px 12px',
    backgroundColor: 'var(--vscode-button-secondaryBackground)',
    color: 'var(--vscode-button-secondaryForeground)',
    border: '1px solid var(--vscode-button-border)',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '12px',
  },
  deleteButton: {
    padding: '6px 12px',
    backgroundColor: 'var(--vscode-button-background)',
    color: 'var(--vscode-button-foreground)',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '12px',
  },
  identityDetails: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '8px',
    paddingTop: '12px',
    borderTop: '1px solid var(--vscode-panel-border)',
  },
  detailItem: {
    fontSize: '13px',
    color: 'var(--vscode-descriptionForeground)',
  },
  sshPath: {
    backgroundColor: 'var(--vscode-textCodeBlock-background)',
    padding: '2px 6px',
    borderRadius: '3px',
    fontFamily: 'var(--vscode-editor-font-family)',
    fontSize: '12px',
    marginLeft: '8px',
  },
};

// Add spinner animation
const styleSheet = document.createElement('style');
styleSheet.textContent = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;
document.head.appendChild(styleSheet);

// Initialize React app
console.log('Webview: Starting React app initialization');
const rootElement = document.getElementById('root');
if (rootElement) {
  console.log('Webview: Root element found, creating React root');
  try {
    const root = ReactDOM.createRoot(rootElement);
    console.log('Webview: Rendering App component');
    root.render(<App />);
    console.log('Webview: App component rendered successfully');
  } catch (error) {
    console.error('Webview: Failed to render React app:', error);
    rootElement.innerHTML = `
      <div style="padding: 20px; color: var(--vscode-errorForeground);">
        <h2>Error Loading GitSwitch</h2>
        <p>Failed to initialize the webview. Please check the console for details.</p>
        <pre>${String(error)}</pre>
      </div>
    `;
  }
} else {
  console.error('Webview: Root element not found');
  document.body.innerHTML = '<div style="padding: 20px; color: red;">Error: Root element not found</div>';
}
