import { ItemView, setIcon, type WorkspaceLeaf } from "obsidian";
import type TodoistPlugin from "../main";
import { TaskRenderer } from "./TaskRenderer";

export const TODOIST_VIEW_TYPE = "todoist-sidebar-view";

export class TodoistSidebarView extends ItemView {
  plugin: TodoistPlugin;

  constructor(leaf: WorkspaceLeaf, plugin: TodoistPlugin) {
    super(leaf);
    this.plugin = plugin;
  }

  getViewType() {
    return TODOIST_VIEW_TYPE;
  }

  getDisplayText() {
    return "Todoist";
  }

  getIcon() {
    return "check-square";
  }

  async onOpen() {
    const container = this.contentEl;
    container.empty();
    container.addClass("todoist-sidebar");

    const header = container.createEl("div", { cls: "todoist-sidebar-header" });
    const headerTitle = header.createEl("h4", { text: "Todoist Today" });
    headerTitle.setCssStyles({ margin: "0" });

    const refreshBtn = header.createEl("button", { cls: "clickable-icon" });
    setIcon(refreshBtn, "refresh-cw");
    refreshBtn.setAttribute("aria-label", "Refresh tasks");
    refreshBtn.onclick = () => this.renderTasks(content);

    const content = container.createDiv({ cls: "todoist-sidebar-content" });

    await this.renderTasks(content);
  }

  async renderTasks(container: HTMLElement) {
    container.empty();

    if (!this.plugin.todoistService) {
      container.createEl("p", {
        text: "Please configure your Todoist API token in settings.",
        cls: "todoist-error",
      });
      return;
    }

    const loading = container.createEl("p", {
      text: "Loading tasks...",
      cls: "todoist-loading",
    });

    try {
      const tasks =
        await this.plugin.todoistService.fetchTasks("today | overdue");
      const projects = await this.plugin.todoistService.getProjects();
      loading.remove();

      if (tasks.length === 0) {
        container.createEl("p", { text: "No tasks for today! 🎉" });
      } else {
        TaskRenderer.renderHTML(tasks, container, projects);
      }
    } catch {
      loading.remove();
      container.createEl("p", {
        text: "Failed to load tasks.",
        cls: "todoist-error",
      });
    }
  }

  async onClose() {
    // Cleanup if necessary
  }
}
