import { App, PluginSettingTab, Setting, setIcon } from "obsidian";
import { z } from "zod";
import TodoistPlugin from "./main";

// We intentionally keep the settings interface empty of the token
// because we don't want it saved to data.json.
export const TodoistPluginSettingsSchema = z.object({
  defaultProject: z.string().optional(),
  defaultPriority: z.number().min(1).max(4).default(1),
  defaultDate: z.string().default("today"),
  defaultLabels: z.array(z.string()).default([]),
});

export type TodoistPluginSettings = z.infer<typeof TodoistPluginSettingsSchema>;

export const DEFAULT_SETTINGS: TodoistPluginSettings = {
  defaultPriority: 1,
  defaultDate: "today",
  defaultLabels: [],
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
    containerEl.addClass("todoist-settings-tab");

    containerEl.createEl("h3", { text: "General" });

    const linksSetting = new Setting(containerEl)
      .setName("Links")
      .setDesc("Helpful links and resources for Todoist Plug.");
      
    linksSetting.addButton((btn) => btn.setButtonText("Docs").setIcon("book-open").setTooltip("View documentation").setCta().setClass("todoist-settings-btn").onClick(() => window.open("https://github.com/albibenni/Todoist-Plug#readme")));
    linksSetting.addButton((btn) => btn.setButtonText("Feedback").setIcon("github").setTooltip("Report an issue").setCta().setClass("todoist-settings-btn").onClick(() => window.open("https://github.com/albibenni/Todoist-Plug/issues")));
    linksSetting.addButton((btn) => btn.setButtonText("Donate").setIcon("coffee").setTooltip("Support development").setCta().setClass("todoist-settings-btn").onClick(() => window.open("https://www.paypal.com/donate/?cmd=_donations&business=JEUGAV9HY5YFU&currency_code=EUR&source=url")));

    const apiSetting = new Setting(containerEl)
      .setName("API token")
      .setDesc("The Todoist API token to use when fetching tasks");
    
    if (this.plugin.getApiToken()) {
        const checkIcon = apiSetting.controlEl.createSpan("todoist-success-icon");
        setIcon(checkIcon, "check-circle");
    }

    apiSetting.addText((text) => {
        text
          .setPlaceholder("Enter your API token")
          .setValue(this.plugin.getApiToken() || "")
          .onChange((value) => {
            this.plugin.setApiToken(value);
            this.plugin.initTodoistClient();
          });
        text.inputEl.type = "password";
    });

    containerEl.createEl("h3", { text: "Defaults" }).style.marginTop = "2em";

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
      .setDesc("The default due date string for new tasks.")
      .addDropdown((dropdown) => {
        dropdown.addOption("today", "Today");
        dropdown.addOption("tomorrow", "Tomorrow");
        dropdown.addOption("next week", "Next week");
        dropdown.addOption("no date", "No date");
        dropdown.setValue(this.plugin.settings.defaultDate);
        dropdown.onChange(async (value) => {
          this.plugin.settings.defaultDate = value;
          await this.plugin.saveSettings();
        });
      });

    new Setting(containerEl)
      .setName("Default Labels")
      .setDesc("Comma-separated list of labels to apply by default.")
      .addText((text) => {
        text
          .setPlaceholder("e.g. work, important")
          .setValue((this.plugin.settings.defaultLabels || []).join(", "))
          .onChange(async (value) => {
            this.plugin.settings.defaultLabels = value
              .split(",")
              .map((l) => l.trim())
              .filter((l) => l.length > 0);
            await this.plugin.saveSettings();
          });
      });
  }
}
