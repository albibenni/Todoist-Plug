import {
  App,
  PluginSettingTab,
  Setting,
  type SettingDefinitionItem,
  setIcon,
  SecretComponent,
} from "obsidian";
import type TodoistPlugin from "./main";

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

    const linksSetting = new Setting(containerEl)
      .setName("Links")
      .setDesc("Helpful links and resources for Todoist Plug.");

    linksSetting.addButton((btn) => {
      btn
        .setButtonText("Docs")
        .setTooltip("View documentation")
        .setCta()
        .setClass("todoist-settings-btn")
        .onClick(() =>
          window.open("https://github.com/albibenni/Todoist-Plug#readme"),
        );
      const icon = btn.buttonEl.createSpan();
      setIcon(icon, "book-open");
      btn.buttonEl.prepend(icon);
    });

    linksSetting.addButton((btn) => {
      btn
        .setButtonText("Feedback")
        .setTooltip("Report an issue")
        .setCta()
        .setClass("todoist-settings-btn")
        .onClick(() =>
          window.open("https://github.com/albibenni/Todoist-Plug/issues"),
        );
      const icon = btn.buttonEl.createSpan();
      setIcon(icon, "github");
      btn.buttonEl.prepend(icon);
    });

    linksSetting.addButton((btn) => {
      btn
        .setButtonText("Donate")
        .setTooltip("Support development")
        .setCta()
        .setClass("todoist-settings-btn")
        .onClick(() =>
          window.open(
            "https://www.paypal.com/donate/?cmd=_donations&business=JEUGAV9HY5YFU&currency_code=EUR&source=url",
          ),
        );
      const icon = btn.buttonEl.createSpan();
      setIcon(icon, "coffee");
      btn.buttonEl.prepend(icon);
    });

    const apiSetting = new Setting(containerEl)
      .setName("API token")
      .setDesc("Select a secret from SecretStorage")
      .addComponent((el) =>
        new SecretComponent(this.app, el)
          .setValue(this.plugin.settings.apiToken || "")
          .onChange((value) => {
            this.plugin.settings.apiToken = value;
            void this.plugin.saveSettings();
            this.plugin.initTodoistClient();
          })
      );

    new Setting(containerEl).setName("Default Settings").setHeading();

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
            projects.forEach((p) => {
              dropdown.addOption(p.id, p.name);
            });
            dropdown.setValue(this.plugin.settings.defaultProject || "");
            dropdown.onChange((value) => {
              this.plugin.settings.defaultProject = value;
              void this.plugin.saveSettings();
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
        dropdown.onChange((value) => {
          this.plugin.settings.defaultPriority = Number(value);
          void this.plugin.saveSettings();
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
        dropdown.onChange((value) => {
          this.plugin.settings.defaultDate = value;
          void this.plugin.saveSettings();
        });
      });

    new Setting(containerEl)
      .setName("Default Labels")
      .setDesc("Comma-separated list of labels to apply by default.")
      .addText((text) => {
        text
          .setPlaceholder("e.g. work, important")
          .setValue((this.plugin.settings.defaultLabels || []).join(", "))
          .onChange((value) => {
            this.plugin.settings.defaultLabels = value
              .split(",")
              .map((l) => l.trim())
              .filter((l) => l.length > 0);
            void this.plugin.saveSettings();
          });
      });
  }

  // Implement getSettingDefinitions to support settings search in Obsidian 1.13.0+
  getSettingDefinitions(): SettingDefinitionItem[] {
    return [];
  }
}
