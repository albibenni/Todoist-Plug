# Todoist-Plug

A robust integration between Todoist and Obsidian for managing your tasks natively within your knowledge base.

## Features

- **Quick Add Task Modal**: A beautiful, fully-featured modal for creating tasks without leaving Obsidian.
  - **Context-Aware**: Automatically populates the task title with your currently selected text, or falls back to your active file name.
  - **Obsidian Linking**: Can automatically append a deep link to your current Obsidian note directly into the Todoist task description.
  - **Premium Property Selectors**: Features rich, searchable popover menus for selecting **Projects**, **Labels**, **Dates**, and **Priorities**.
  - **Color Synchronization**: Pulls live project and label data straight from the Todoist API, mapping them accurately with their native Todoist colors.
- **Configurable Defaults**: A sleek, card-based Settings tab that allows you to configure your desired defaults for new tasks (Default Project, Default Priority, Default Date, and Default Labels).
- **Secure Authentication**: Uses Obsidian's native OS keychain (`app.secretStorage`) to securely store your Todoist API token locally, preventing it from syncing in plaintext.

## How to use

1. Clone this repository into your vault's plugin folder (`.obsidian/plugins/Todoist-Plug`).
2. Ensure you have NodeJS installed (v18+).
3. Run `pnpm i` to install dependencies.
4. Run `pnpm run dev` to compile the plugin.
5. Enable the plugin in Obsidian settings.
6. Open the plugin settings and paste your Todoist API token to get started.

## Development

This project uses `pnpm` for package management and `biome` for lightning-fast linting and formatting.

- `pnpm run dev` - Compile in watch mode
- `pnpm run build` - Build for production
- `pnpm run lint` - Run Biome checks
- `pnpm run indent:write` - Format codebase with Biome

## License
MIT License. See the [LICENSE](LICENSE) file for more information.
