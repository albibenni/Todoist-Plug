# Todoist-Plug

A robust integration between Todoist and Obsidian for managing your tasks natively within your knowledge base.

## Features (In Progress)
- **Secure Authentication**: Uses Obsidian's native OS keychain (`app.secretStorage`) to securely store your Todoist API token, preventing it from syncing in plaintext.
- **Task Materialization** (Coming Soon): Render your Todoist tasks directly inside Obsidian notes using Markdown code blocks.
- **Quick Add** (Coming Soon): Quickly send tasks to Todoist without leaving Obsidian.

## How to use

1. Clone this repository into your vault's plugin folder (`.obsidian/plugins/Todoist-Plug`).
2. Ensure you have NodeJS installed (v18+).
3. Run `pnpm i` to install dependencies.
4. Run `pnpm run dev` to compile the plugin.
5. Enable the plugin in Obsidian settings.
6. Open the plugin settings and paste your Todoist API token.

## Development

This project uses `pnpm` for package management and `biome` for lightning-fast linting and formatting.

- `pnpm run dev` - Compile in watch mode
- `pnpm run build` - Build for production
- `pnpm run lint` - Run Biome checks
- `pnpm run indent:write` - Format codebase with Biome

## License
MIT License. See the [LICENSE](LICENSE) file for more information.
