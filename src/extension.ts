// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { BranchWatcher } from './branchWatcher';
import { TabStateManager } from './tabStateManager';
import { PersistenceManager } from './persistenceManager';

let branchWatcher: BranchWatcher | null = null;

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "git-branch-tabs" is now active!');

	// Initialize components
	const persistenceManager = new PersistenceManager(context);
	const tabStateManager = new TabStateManager();
	branchWatcher = new BranchWatcher();

	// Set up the branch watcher
	branchWatcher.start(context, async (oldBranch, newBranch) => {
		console.log(`Branch changed from ${oldBranch} to ${newBranch}`);

		if (oldBranch) {
			// Save current tab states for the old branch
			const currentTabStates = await tabStateManager.saveCurrentTabStates();
			await persistenceManager.saveBranchTabStates(oldBranch, currentTabStates);
			console.log(`Saved ${currentTabStates.length} tabs for branch: ${oldBranch}`);
		}

		// Close all current tabs
		await tabStateManager.closeAllTabs();

		// Restore tab states for the new branch
		const tabStatesForNewBranch = await persistenceManager.getTabStatesForBranch(newBranch);
		if (tabStatesForNewBranch.length > 0) {
			console.log(`Restoring ${tabStatesForNewBranch.length} tabs for branch: ${newBranch}`);
			await tabStateManager.restoreTabStates(tabStatesForNewBranch);
		} else {
			console.log(`No saved tabs for branch: ${newBranch}`);
		}
	});

	// Register command for manual sync (optional)
	const syncCommand = vscode.commands.registerCommand('git-branch-tabs.syncTabs', async () => {
		const currentBranch = await getCurrentBranch();
		if (currentBranch) {
			const currentTabStates = await tabStateManager.saveCurrentTabStates();
			await persistenceManager.saveBranchTabStates(currentBranch, currentTabStates);
			vscode.window.showInformationMessage(`Saved current tabs for branch: ${currentBranch}`);
		}
	});

	context.subscriptions.push(syncCommand);
}

async function getCurrentBranch(): Promise<string | null> {
	try {
		const gitExtension = vscode.extensions.getExtension('vscode.git');
		if (!gitExtension) {
			return null;
		}

		const git = gitExtension.exports.getAPI(1);
		if (git.repositories.length === 0) {
			return null;
		}

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

// This method is called when your extension is deactivated
export function deactivate() {
	if (branchWatcher) {
		branchWatcher.stop();
		branchWatcher = null;
	}
}
