import * as vscode from 'vscode';
import { TabState } from './types';

export class TabStateManager {
  async saveCurrentTabStates(): Promise<TabState[]> {
    const tabStates: TabState[] = [];
    
    // Use tabGroups to get all open tabs, not just visible editors
    for (const tabGroup of vscode.window.tabGroups.all) {
      for (const tab of tabGroup.tabs) {
        // Check if the tab has input with uri property
        if (tab.input && typeof tab.input === 'object' && 'uri' in tab.input) {
          const uri = (tab.input as any).uri as vscode.Uri;
          if (uri && uri.scheme === 'file') {
            // Get the document and editor if available to capture selection
            let selection = undefined;
            const editor = vscode.window.visibleTextEditors.find(e => e.document.uri.toString() === uri.toString());
            
            if (editor) {
              selection = {
                start: {
                  line: editor.selection.start.line,
                  character: editor.selection.start.character
                },
                end: {
                  line: editor.selection.end.line,
                  character: editor.selection.end.character
                }
              };
            }
            
            const tabState: TabState = {
              uri: uri.toString(),
              viewColumn: tabGroup.viewColumn,
              selection: selection
            };
            tabStates.push(tabState);
          }
        }
      }
    }
    
    return tabStates;
  }

  async closeAllTabs(): Promise<void> {
    try {
      await vscode.commands.executeCommand('workbench.action.closeAllEditors');
    } catch (error) {
      console.error('Error closing all tabs:', error);
    }
  }

  async restoreTabStates(tabStates: TabState[]): Promise<void> {
    if (!tabStates || tabStates.length === 0) {
      return;
    }

    for (const tabState of tabStates) {
      try {
        const uri = vscode.Uri.parse(tabState.uri);
        
        // Check if the file exists before attempting to open
        try {
          await vscode.workspace.fs.stat(uri);
        } catch {
          // File doesn't exist anymore, skip this tab
          console.warn(`File no longer exists: ${uri.toString()}`);
          continue;
        }

        const document = await vscode.workspace.openTextDocument(uri);
        const editor = await vscode.window.showTextDocument(document, {
          viewColumn: tabState.viewColumn,
          preserveFocus: false,
          preview: false
        });

        // Restore cursor position if available
        if (tabState.selection) {
          const selection = new vscode.Selection(
            new vscode.Position(tabState.selection.start.line, tabState.selection.start.character),
            new vscode.Position(tabState.selection.end.line, tabState.selection.end.character)
          );
          editor.selection = selection;
        }
      } catch (error) {
        console.error('Error restoring tab:', error);
      }
    }
  }
}