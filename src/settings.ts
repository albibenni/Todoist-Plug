import {
  App,
  PluginSettingTab,
  SecretComponent,
  Setting,
  type SettingDefinitionItem,
  setIcon,
} from "obsidian";
import type TodoistPlugin from "./main";

export class TodoistSettingTab extends PluginSettingTab {
  plugin: TodoistPlugin;

  constructor(app: App, plugin: TodoistPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  getSettingDefinitions(): SettingDefinitionItem[] {
    return [
      {
        type: "group",
        cls: "todoist-settings-tab",
        items: [
          {
            name: "Todoist account",
            desc: this.oauthDescription(),
            render: (setting) => this.configureOauthConnection(setting),
          },
          {
            name: "API token",
            desc: "Optional fallback: select a personal token from SecretStorage.",
            render: (setting) => this.configureApiToken(setting),
          },
        ],
      },
      {
        type: "group",
        heading: "Defaults",
        cls: "todoist-settings-tab",
        items: [
          {
            name: "Links",
            desc: "Helpful links and resources for Todoist Plug.",
            render: (setting) => this.configureLinks(setting),
          },
          {
            name: "Default Project",
            desc: "The default project where new tasks are created (defaults to Inbox).",
            render: (setting) => this.configureProject(setting),
          },
          {
            name: "Default Priority",
            desc: "The default priority for new tasks (1 = Normal, 4 = Highest). Note: Todoist API treats 1 as normal (P4) and 4 as highest (P1).",
            render: (setting) => this.configurePriority(setting),
          },
          {
            name: "Default Date",
            desc: "The default due date string for new tasks.",
            render: (setting) => this.configureDate(setting),
          },
          {
            name: "Default Labels",
            desc: "Comma-separated list of labels to apply by default.",
            render: (setting) => this.configureLabels(setting),
          },
        ],
      },
    ];
  }

  /** Fallback for Obsidian versions before 1.13. */
  display(): void {
    const { containerEl } = this;

    containerEl.empty();
    containerEl.addClass("todoist-settings-tab");

    this.configureOauthConnection(
      new Setting(containerEl)
        .setName("Todoist account")
        .setDesc(this.oauthDescription()),
    );
    this.configureApiToken(
      new Setting(containerEl)
        .setName("API token")
        .setDesc(
          "Optional fallback: select a personal token from SecretStorage.",
        ),
    );
    new Setting(containerEl).setName("Defaults").setHeading();
    this.configureLinks(
      new Setting(containerEl)
        .setName("Links")
        .setDesc("Helpful links and resources for Todoist Plug."),
    );

    const projectSetting = new Setting(containerEl)
      .setName("Default Project")
      .setDesc(
        "The default project where new tasks are created (defaults to Inbox).",
      );

    this.configureProject(projectSetting);

    this.configurePriority(
      new Setting(containerEl)
        .setName("Default Priority")
        .setDesc(
          "The default priority for new tasks (1 = Normal, 4 = Highest). Note: Todoist API treats 1 as normal (P4) and 4 as highest (P1).",
        ),
    );
    this.configureDate(
      new Setting(containerEl)
        .setName("Default Date")
        .setDesc("The default due date string for new tasks."),
    );
    this.configureLabels(
      new Setting(containerEl)
        .setName("Default Labels")
        .setDesc("Comma-separated list of labels to apply by default."),
    );
  }

  private oauthDescription(): string {
    const connected = Boolean(this.plugin.settings.oauthAccessTokenSecret);
    return connected
      ? "Connected with Todoist OAuth. Tokens are stored in SecretStorage."
      : "Connect securely with Todoist. No personal API token is required.";
  }

  private configureOauthConnection(setting: Setting): void {
    const connected = Boolean(this.plugin.settings.oauthAccessTokenSecret);
    setting.addButton((button) => {
      button
        .setButtonText(connected ? "Reconnect" : "Connect")
        .setCta()
        .onClick(() => void this.plugin.startOAuthConnection());
    });
    if (connected) {
      setting.addButton((button) => {
        button.setButtonText("Disconnect");
        if (typeof button.setDestructive === "function") {
          button.setDestructive();
        } else {
          // Preserve the warning style on Obsidian versions before 1.13.
          button.buttonEl.addClass("mod-warning");
        }
        button.onClick(() => void this.plugin.disconnectTodoist());
      });
    }
  }

  private configureLinks(setting: Setting): void {
    setting.addButton((btn) => {
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
    setting.addButton((btn) => {
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

    setting.addButton((btn) => {
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
  }

  private configureApiToken(setting: Setting): void {
    setting.addComponent((el) =>
      new SecretComponent(this.app, el)
        .setValue(this.plugin.settings.apiToken || "")
        .onChange((value) => {
          this.plugin.settings.apiToken = value;
          void this.plugin.saveSettings();
          void this.plugin.initTodoistClient();
        }),
    );
  }

  private configureProject(setting: Setting): void {
    if (!this.plugin.todoistService) return;

    this.plugin.todoistService
      .getProjects()
      .then((projects) => {
        setting.addDropdown((dropdown) => {
          dropdown.addOption("", "Inbox");
          projects.forEach((project) => {
            dropdown.addOption(project.id, project.name);
          });
          dropdown.setValue(this.plugin.settings.defaultProject || "");
          dropdown.onChange((value) => {
            this.plugin.settings.defaultProject = value;
            void this.plugin.saveSettings();
          });
        });
      })
      .catch(() => {
        setting.setDesc("Failed to load projects. Check your API token.");
      });
  }

  private configurePriority(setting: Setting): void {
    setting.addDropdown((dropdown) => {
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
  }

  private configureDate(setting: Setting): void {
    setting.addDropdown((dropdown) => {
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
  }

  private configureLabels(setting: Setting): void {
    setting.addText((text) => {
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
}
