import * as vscode from 'vscode';

export class BranchWatcher {
  private currentBranch: string | null = null;
  private disposables: vscode.Disposable[] = [];
  private onBranchChangedCallback: ((oldBranch: string | null, newBranch: string) => void) | null = null;

  constructor() {}

  start(context: vscode.ExtensionContext, onBranchChanged: (oldBranch: string | null, newBranch: string) => void): void {
    this.onBranchChangedCallback = onBranchChanged;

    // Get the current branch when starting
    this.getCurrentBranch().then(branch => {
      this.currentBranch = branch;
    });

    // Watch for Git changes
    const gitExtension = vscode.extensions.getExtension('vscode.git');
    if (gitExtension) {
      const git = gitExtension.exports.getAPI(1);
      
      // Watch repositories for changes
      git.repositories.forEach((repo: any) => {
        this.disposables.push(
          repo.state.onDidChange(() => {
            this.checkBranchChange();
          })
        );
      });

      // Watch for new repositories being added
      this.disposables.push(
        git.onDidOpenRepository((repo: any) => {
          this.disposables.push(
            repo.state.onDidChange(() => {
              this.checkBranchChange();
            })
          );
        })
      );
    }

    // Also set up a periodic check as a fallback
    const interval = setInterval(() => {
      this.checkBranchChange();
    }, 2000); // Check every 2 seconds

    this.disposables.push(new vscode.Disposable(() => clearInterval(interval)));
  }

  private async checkBranchChange(): Promise<void> {
    const currentBranch = await this.getCurrentBranch();
    
    if (currentBranch && currentBranch !== this.currentBranch) {
      const oldBranch = this.currentBranch;
      this.currentBranch = currentBranch;
      
      if (this.onBranchChangedCallback) {
        this.onBranchChangedCallback(oldBranch, currentBranch);
      }
    }
  }

  private async getCurrentBranch(): Promise<string | null> {
    try {
      const gitExtension = vscode.extensions.getExtension('vscode.git');
      if (!gitExtension) {
        console.warn('Git extension not available');
        return null;
      }

      const git = gitExtension.exports.getAPI(1);
      if (git.repositories.length === 0) {
        console.warn('No Git repositories found');
        return null;
      }

      // Get the first repository (or the one for the current workspace)
      const repo = git.repositories[0];
      if (!repo || !repo.state || !repo.state.HEAD) {
        return null;
      }

      return repo.state.HEAD.name || null;
    } catch (error) {
      console.error('Error getting current branch:', error);
      return null;
    }
  }

  stop(): void {
    for (const disposable of this.disposables) {
      disposable.dispose();
    }
    this.disposables = [];
  }
}