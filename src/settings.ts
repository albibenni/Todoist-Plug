import { App, PluginSettingTab, Setting } from "obsidian";
import { z } from "zod";
import TodoistPlugin from "./main";

// We intentionally keep the settings interface empty of the token
// because we don't want it saved to data.json.
export const TodoistPluginSettingsSchema = z.object({
  defaultProject: z.string().optional(),
  defaultPriority: z.number().min(1).max(4).default(1),
  defaultDate: z.string().default("today"),
});

export type TodoistPluginSettings = z.infer<typeof TodoistPluginSettingsSchema>;

export const DEFAULT_SETTINGS: TodoistPluginSettings = {
  defaultPriority: 1,
  defaultDate: "today",
};

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

    const projectSetting = new Setting(containerEl)
      .setName("Default Project")
      .setDesc(
        "The default project where new tasks are created (defaults to Inbox).",
      );

    // Fetch projects to populate the dropdown
    if (this.plugin.todoistService) {
      this.plugin.todoistService
        .getProjects()
        .then((projects) => {
          projectSetting.addDropdown((dropdown) => {
            dropdown.addOption("", "Inbox");
            projects.forEach((p) => dropdown.addOption(p.id, p.name));
            dropdown.setValue(this.plugin.settings.defaultProject || "");
            dropdown.onChange(async (value) => {
              this.plugin.settings.defaultProject = value;
              await this.plugin.saveSettings();
            });
          });
        })
        .catch(() => {
          projectSetting.setDesc(
            "Failed to load projects. Check your API token.",
          );
        });
    }

    new Setting(containerEl)
      .setName("Default Priority")
      .setDesc(
        "The default priority for new tasks (1 = Normal, 4 = Highest). Note: Todoist API treats 1 as normal (P4) and 4 as highest (P1).",
      )
      .addDropdown((dropdown) => {
        dropdown.addOption("1", "Priority 4 (Normal)");
        dropdown.addOption("2", "Priority 3");
        dropdown.addOption("3", "Priority 2");
        dropdown.addOption("4", "Priority 1 (Highest)");
        dropdown.setValue(String(this.plugin.settings.defaultPriority));
        dropdown.onChange(async (value) => {
          this.plugin.settings.defaultPriority = Number(value);
          await this.plugin.saveSettings();
        });
      });

    new Setting(containerEl)
      .setName("Default Date")
      .setDesc(
        "The default due date string (e.g., 'today', 'tomorrow', 'next week') for new tasks.",
      )
      .addText((text) => {
        text
          .setPlaceholder("e.g. today")
          .setValue(this.plugin.settings.defaultDate)
          .onChange(async (value) => {
            this.plugin.settings.defaultDate = value;
            await this.plugin.saveSettings();
          });
      });
  }
}
