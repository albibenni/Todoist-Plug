import {
  App,
  type Editor,
  MarkdownView,
  Notice,
  Plugin,
  requestUrl,
  type WorkspaceLeaf,
} from "obsidian";
import { TodoistApi } from "./api";
import { TodoistService } from "./services/TodoistService";
import { TodoistSettingTab } from "./settings";
import {
  DEFAULT_SETTINGS,
  type TodoistPluginSettings,
  TodoistPluginSettingsSchema,
} from "./types";
import { QuickAddModal } from "./ui/QuickAddModal";
import { TaskRenderer } from "./ui/TaskRenderer";
import { TODOIST_VIEW_TYPE, TodoistSidebarView } from "./ui/TodoistSidebarView";

// Removed AppWithSecretStorage interface

export default class TodoistPlugin extends Plugin {
  settings!: TodoistPluginSettings;
  api: TodoistApi | null = null;
  todoistService: TodoistService | null = null;

  async onload() {
    await this.loadSettings();

    // Add settings tab
    this.addSettingTab(new TodoistSettingTab(this.app, this));

    // Initialize Todoist client
    this.initTodoistClient();

    // Command to setup API token
    this.addCommand({
      id: "setup-api-token",
      name: "Setup API token",
      callback: () => {
        new Notice("Please go to the plugin settings to configure your Todoist API token.");
      },
    });

    // Add a command to verify the connection
    this.addCommand({
      id: "verify-todoist-connection",
      name: "Verify Todoist connection",
      callback: async () => {
        if (!this.api) {
          new Notice(
            "Todoist API token is not set. Please update your settings.",
          );
          return;
        }

        try {
          new Notice("Fetching projects from Todoist...");
          await this.api.getProjects();
          new Notice(`Successfully connected!`);
        } catch (error) {
          console.error("Error connecting to Todoist:", error);
          new Notice("Failed to connect to Todoist. Check your API token.");
        }
      },
    });

    // Register the custom sidebar view
    this.registerView(
      TODOIST_VIEW_TYPE,
      (leaf: WorkspaceLeaf) => new TodoistSidebarView(leaf, this),
    );

    // Command to open the sidebar view
    this.addCommand({
      id: "open-todoist-sidebar",
      name: "Open Todoist sidebar",
      callback: () => {
        void this.activateView();
      },
    });

    // Command to create a task from the current line
    this.addCommand({
      id: "add-task-from-current-line",
      name: "Create task from current line",
      editorCallback: async (
        editor: Editor,
        _view: MarkdownView | import("obsidian").MarkdownFileInfo,
      ) => {
        if (!this.todoistService) {
          new Notice("Todoist API token is not set. Please update settings.");
          return;
        }

        let text = editor.getSelection().trim();
        if (!text) {
          const cursor = editor.getCursor();
          text = editor.getLine(cursor.line).trim();
        }

        if (!text) {
          new Notice("No text selected or found on current line.");
          return;
        }

        try {
          new Notice("Adding task to Todoist...");
          await this.todoistService.addQuickTask(text, {
            project_id: this.settings.defaultProject,
            priority: this.settings.defaultPriority,
            due_string: this.settings.defaultDate,
            labels: this.settings.defaultLabels,
          });
          new Notice("Task added successfully!");
        } catch (error) {
          console.error("Failed to add task from line:", error);
          new Notice("Failed to add task.");
        }
      },
    });

    // Command to check if a task exists based on current line or filename
    this.addCommand({
      id: "check-task-exists",
      name: "Check if task already exists",
      editorCallback: async (
        editor: Editor,
        _view: MarkdownView | import("obsidian").MarkdownFileInfo,
      ) => {
        if (!this.todoistService) {
          new Notice("Todoist API token is not set. Please update settings.");
          return;
        }

        let text = editor.getSelection().trim();
        if (!text) {
          const cursor = editor.getCursor();
          text = editor.getLine(cursor.line).trim();
        }

        if (!text) {
          new Notice("No text selected or found on current line.");
          return;
        }

        try {
          const currentFile = this.app.workspace.getActiveFile();
          new Notice(`Searching Todoist for: "${text}"...`);
          const exists = await this.todoistService.checkTaskExists(
            text,
            currentFile ? currentFile.basename : undefined,
          );

          if (exists) {
            new Notice("✅ Yes! This task already exists in Todoist.");
          } else {
            new Notice("❌ No matching task found in Todoist.");
          }
        } catch (error) {
          console.error("Failed to check task existence:", error);
          new Notice("Failed to check Todoist.");
        }
      },
    });

    // Quick Add Task Command
    this.addCommand({
      id: "add-quick-task",
      name: "Add quick task",
      callback: () => {
        if (!this.todoistService) {
          new Notice("Todoist API token is not set. Please update settings.");
          return;
        }

        let initialTitle = "";
        let initialUrl = "";

        // Try to get the active view
        // Require MarkdownView locally to avoid direct circular dependencies if needed
        // But we can just use the workspace API
        const activeView = this.app.workspace.getActiveFile();
        if (activeView) {
          initialUrl = `obsidian://open?vault=${encodeURIComponent(this.app.vault.getName())}&file=${encodeURIComponent(activeView.path)}`;
          initialTitle = activeView.basename;

          // If the editor is open, check for selected text
          const view = this.app.workspace.getActiveViewOfType(MarkdownView);
          if (view) {
            const selection = view.editor.getSelection();
            if (selection && selection.trim().length > 0) {
              initialTitle = selection.trim();
            }
          }
        }

        new QuickAddModal(
          this.app,
          this.todoistService,
          this.settings,
          initialTitle,
          initialUrl,
        ).open();
      },
    });

    // Markdown Code Block Processor for Task Materialization
    this.registerMarkdownCodeBlockProcessor(
      "todoist",
      async (source, el, ctx) => {
        if (!this.todoistService) {
          const p = createEl("p");
          p.textContent = "Todoist API token is not set.";
          p.classList.add("todoist-error");
          el.appendChild(p);
          return;
        }

        const filterQuery = source.trim();

        // Show loading state
        const loadingEl = createEl("p");
        loadingEl.textContent = "Loading tasks...";
        loadingEl.classList.add("todoist-loading");
        el.appendChild(loadingEl);

        try {
          const tasks = await this.todoistService.fetchTasks(filterQuery);
          const projects = await this.todoistService.getProjects();
          // Remove loading element
          loadingEl.remove();
          // Render the HTML
          TaskRenderer.renderHTML(tasks, el, projects);
        } catch {
          loadingEl.remove();
          const p = createEl("p");
          p.textContent = "Failed to load tasks.";
          p.classList.add("todoist-error");
          el.appendChild(p);
        }
      },
    );
  }

  onunload() {
    /* cleanup */
  }

  async activateView() {
    const { workspace } = this.app;

    let leaf: WorkspaceLeaf | null = null;
    const leaves = workspace.getLeavesOfType(TODOIST_VIEW_TYPE);

    if (leaves.length > 0) {
      leaf = leaves[0] ?? null;
    } else {
      leaf = workspace.getRightLeaf(false);
      if (leaf) {
        await leaf.setViewState({ type: TODOIST_VIEW_TYPE, active: true });
      }
    }

    if (leaf) {
      await workspace.revealLeaf(leaf);
    }
  }

  getApiToken(): string | null {
    if (!this.settings.apiToken) return null;
    // @ts-ignore - secretStorage is an undocumented Obsidian API
    return this.app.secretStorage.getSecret(this.settings.apiToken);
  }

  initTodoistClient() {
    const token = this.getApiToken();
    if (token) {
      this.api = new TodoistApi(token);
      this.todoistService = new TodoistService(this.api);
    } else {
      this.api = null;
      this.todoistService = null;
    }
  }

  async loadSettings() {
    const data: unknown = await this.loadData();
    try {
      this.settings = TodoistPluginSettingsSchema.parse(data || {});
    } catch (err) {
      console.error("Failed to parse settings, falling back to defaults:", err);
      this.settings = DEFAULT_SETTINGS;
    }
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }
}
