# Git Branch Tab Sync

A VS Code extension that automatically manages open tabs based on the current Git branch. When you switch Git branches, the extension will close all open tabs and reopen the tabs that were previously open for that branch.

## Features

- Automatically saves the state of open tabs when switching Git branches
- Closes all open tabs when a branch change is detected
- Restores the tabs that were open for the target branch
- Persists tab states in the workspace
- Manual command to sync current tabs with the current branch

## How It Works

1. When you switch Git branches (using VS Code's Git UI or external commands), the extension detects the branch change
2. It saves the current open tabs for the old branch
3. It closes all open editors
4. It restores the tabs that were previously open for the new branch

## Commands

- `Git Branch Tab Sync: Sync Current Tabs with Branch` - Manually save the current open tabs for the current branch

## Requirements

- VS Code Git extension must be installed and enabled

## Extension Settings

This extension does not currently have any configurable settings.

## Known Issues

- May not work properly with very large numbers of open files
- Tab states are stored per workspace, so they won't transfer between different projects

## Release Notes

### 0.0.1

- Initial release
- Basic functionality to save and restore tabs based on Git branch
- Automatic detection of branch changes
