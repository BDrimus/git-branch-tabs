import * as vscode from 'vscode';
import { BranchTabStates, TabState } from './types';

export class PersistenceManager {
  private context: vscode.ExtensionContext;

  constructor(context: vscode.ExtensionContext) {
    this.context = context;
  }

  async saveBranchTabStates(branchName: string, tabStates: TabState[]): Promise<void> {
    try {
      const allStates = await this.getAllTabStates();
      allStates[branchName] = tabStates;
      await this.context.workspaceState.update('branchTabStates', allStates);
    } catch (error) {
      console.error(`Error saving tab states for branch ${branchName}:`, error);
    }
  }

  async getTabStatesForBranch(branchName: string): Promise<TabState[]> {
    try {
      const allStates = await this.getAllTabStates();
      return allStates[branchName] || [];
    } catch (error) {
      console.error(`Error retrieving tab states for branch ${branchName}:`, error);
      return [];
    }
  }

  async getAllTabStates(): Promise<BranchTabStates> {
    const states = this.context.workspaceState.get<BranchTabStates>('branchTabStates');
    return states || {};
  }

  async clearBranchTabStates(branchName: string): Promise<void> {
    try {
      const allStates = await this.getAllTabStates();
      delete allStates[branchName];
      await this.context.workspaceState.update('branchTabStates', allStates);
    } catch (error) {
      console.error(`Error clearing tab states for branch ${branchName}:`, error);
    }
  }
}