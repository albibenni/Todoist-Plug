import { TodoistApi } from "@doist/todoist-sdk";
import type { RequestUrlParam, RequestUrlResponse } from "obsidian";
import {
  type Editor,
  MarkdownView,
  Notice,
  Plugin,
  requestUrl,
  type WorkspaceLeaf,
} from "obsidian";
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

const TOKEN_KEY = "todoist-api-token";

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
          const _projects = await this.api.getProjects();
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
        this.activateView();
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
          await this.todoistService.addQuickTask(text);
          new Notice("Task added successfully!");
        } catch (error) {
          console.error("Failed to add task from line:", error);
          new Notice("Failed to add task.");
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
          const p = document.createElement("p");
          p.textContent = "Todoist API token is not set.";
          p.classList.add("todoist-error");
          el.appendChild(p);
          return;
        }

        const filterQuery = source.trim();

        // Show loading state
        const loadingEl = document.createElement("p");
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
        } catch (_error) {
          loadingEl.remove();
          const p = document.createElement("p");
          p.textContent = "Failed to load tasks.";
          p.classList.add("todoist-error");
          el.appendChild(p);
        }
      },
    );
  }

  onunload() {
    console.log("Unloading Todoist Bridge plugin");
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
      workspace.revealLeaf(leaf);
    }
  }

  getApiToken(): string | null {
    return this.app.secretStorage.getSecret(TOKEN_KEY);
  }

  setApiToken(token: string) {
    this.app.secretStorage.setSecret(TOKEN_KEY, token);
  }

  initTodoistClient() {
    const token = this.getApiToken();
    if (token) {
      // Wrap Obsidian's requestUrl to perfectly match standard fetch API
      const customFetch = async (
        url: RequestInfo | URL,
        init?: RequestInit,
      ) => {
        const headers: Record<string, string> = {};
        if (init?.headers) {
          new Headers(init.headers).forEach((value, key) => {
            headers[key] = value;
          });
        }

        const req: RequestUrlParam = {
          url: url.toString(),
          method: init?.method || "GET",
          headers,
          body:
            typeof init?.body === "string" || init?.body instanceof ArrayBuffer
              ? init.body
              : undefined,
          throw: false,
        };
        const res: RequestUrlResponse = await requestUrl(req);

        return {
          ok: res.status >= 200 && res.status < 300,
          status: res.status,
          statusText: res.status >= 200 && res.status < 300 ? "OK" : "Error",
          json: async () => res.json,
          text: async () => (typeof res.text === "string" ? res.text : ""),
          headers: res.headers,
        };
      };

      this.api = new TodoistApi(token, {
        customFetch: customFetch,
      });
      this.todoistService = new TodoistService(this.api);
      console.log("Todoist client initialized with Obsidian requestUrl.");
    } else {
      this.api = null;
      this.todoistService = null;
      console.log("Todoist client not initialized: Missing API token.");
    }
  }

  async loadSettings() {
    const data = await this.loadData();
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
