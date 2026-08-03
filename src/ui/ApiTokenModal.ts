import { App, Modal, Notice, Setting } from "obsidian";
import type TodoistPlugin from "../main";

export class ApiTokenModal extends Modal {
  private token: string;

  constructor(
    app: App,
    private plugin: TodoistPlugin,
  ) {
    super(app);
    this.token = plugin.getApiToken() || "";
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.empty();

    contentEl.createEl("h2", { text: "Todoist API Token" });

    const desc = contentEl.createEl("p");
    desc.innerHTML =
      "Enter your Todoist API token below. You can find this in your Todoist <b>Settings > Integrations > Developer</b>.";

    new Setting(contentEl).setName("API Token").addText((text) => {
      text.inputEl.type = "password";
      text.inputEl.style.width = "300px";
      text
        .setPlaceholder("Enter token...")
        .setValue(this.token)
        .onChange((value) => {
          this.token = value.trim();
        });
    });

    new Setting(contentEl).addButton((btn) =>
      btn
        .setButtonText("Save & Verify")
        .setCta()
        .onClick(async () => {
          btn.setButtonText("Verifying...");
          btn.setDisabled(true);

          this.plugin.setApiToken(this.token);
          this.plugin.initTodoistClient();

          if (!this.plugin.api) {
            new Notice("Token cleared.");
            this.close();
            return;
          }

          try {
            await this.plugin.api.getProjects();
            new Notice("✅ Successfully connected to Todoist!");
            this.close();
          } catch (error) {
            console.error("Verification failed:", error);
            new Notice("❌ Invalid API token. Failed to connect.");
            btn.setButtonText("Save & Verify");
            btn.setDisabled(false);
          }
        }),
    );
  }

  onClose() {
    const { contentEl } = this;
    contentEl.empty();
  }
}
