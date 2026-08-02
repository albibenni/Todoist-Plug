import { App, PluginSettingTab, Setting } from "obsidian";
import TodoistPlugin from "./main";

import { z } from 'zod';

// We intentionally keep the settings interface empty of the token
// because we don't want it saved to data.json.
export const TodoistPluginSettingsSchema = z.object({});

export type TodoistPluginSettings = z.infer<typeof TodoistPluginSettingsSchema>;

export const DEFAULT_SETTINGS: TodoistPluginSettings = {};

export class TodoistSettingTab extends PluginSettingTab {
  plugin: TodoistPlugin;

  constructor(app: App, plugin: TodoistPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;

    containerEl.empty();

    containerEl.createEl("h2", { text: "Todoist Plug Settings" });

    new Setting(containerEl)
      .setName("API Token")
      .setDesc(
        "Your Todoist API token. This is saved securely to your OS keychain and does not sync to other devices.",
      )
      .addText((text) => {
        text
          .setPlaceholder("Enter your API token")
          .setValue(this.plugin.getApiToken() || "")
          .onChange((value) => {
            this.plugin.setApiToken(value);
            // Re-initialize the API client when the token changes
            this.plugin.initTodoistClient();
          });
        text.inputEl.type = "password";
      });
  }
}
