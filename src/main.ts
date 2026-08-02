import { Notice, Plugin } from "obsidian";
import { TodoistApi } from "@doist/todoist-sdk";
import {
  DEFAULT_SETTINGS,
  TodoistPluginSettings,
  TodoistSettingTab,
} from "./settings";

const TOKEN_KEY = "todoist-api-token";

export default class TodoistPlugin extends Plugin {
  settings!: TodoistPluginSettings;
  api: TodoistApi | null = null;

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
          const projects = await this.api.getProjects();
          new Notice(`Successfully connected! Found projects data.`);
        } catch (error) {
          console.error("Error connecting to Todoist:", error);
          new Notice("Failed to connect to Todoist. Check your API token.");
        }
      },
    });

    // Add a basic command to create a quick task
    this.addCommand({
      id: "add-quick-task",
      name: "Add quick task",
      callback: () => {
        if (!this.api) {
          new Notice("Todoist API token is not set.");
          return;
        }
        // For now, this is a placeholder. Later we will open a modal.
        new Notice("Quick add task modal not yet implemented!");
      },
    });
  }

  onunload() {
    console.log("Unloading Todoist Bridge plugin");
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
      this.api = new TodoistApi(token);
      console.log("Todoist client initialized.");
    } else {
      this.api = null;
      console.log("Todoist client not initialized: Missing API token.");
    }
  }

  async loadSettings() {
    this.settings = Object.assign(
      {},
      DEFAULT_SETTINGS,
      (await this.loadData()) as Partial<TodoistPluginSettings>,
    );
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }
}
