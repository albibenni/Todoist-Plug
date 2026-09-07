import { App, Modal, Notice } from "obsidian";
import type { Project, Task } from "../api";
import type { TodoistService } from "../services/TodoistService";

export class MatchingTasksModal extends Modal {
  private readonly selectedTaskIds = new Set<string>();
  private projectsById = new Map<string, string>();

  constructor(
    app: App,
    private readonly service: TodoistService,
    private readonly tasks: Task[],
  ) {
    super(app);
  }

  onOpen() {
    this.renderSelection();
    void this.service
      .getProjects()
      .then((projects) => {
        this.projectsById = new Map(
          projects.map((project: Project) => [project.id, project.name]),
        );
        this.renderSelection();
      })
      .catch(() => undefined);
  }

  private renderSelection() {
    this.contentEl.empty();
    this.contentEl.createEl("h2", { text: "Matching Todoist tasks" });
    this.contentEl.createEl("p", {
      text: "Select the tasks you want to delete. No tasks are selected by default.",
    });

    const selectAllLabel = this.contentEl.createEl("label");
    const selectAll = selectAllLabel.createEl("input", { type: "checkbox" });
    selectAll.checked = this.selectedTaskIds.size === this.tasks.length;
    selectAllLabel.appendText(" Select all");
    selectAll.addEventListener("change", () => {
      if (selectAll.checked) {
        this.tasks.forEach((task) => this.selectedTaskIds.add(task.id));
      } else {
        this.selectedTaskIds.clear();
      }
      this.renderSelection();
    });

    const list = this.contentEl.createEl("div", {
      cls: "todoist-matching-tasks",
    });
    for (const task of this.tasks) {
      const row = list.createEl("label", { cls: "todoist-matching-task" });
      const checkbox = row.createEl("input", { type: "checkbox" });
      checkbox.checked = this.selectedTaskIds.has(task.id);
      checkbox.addEventListener("change", () => {
        if (checkbox.checked) this.selectedTaskIds.add(task.id);
        else this.selectedTaskIds.delete(task.id);
        selectAll.checked = this.selectedTaskIds.size === this.tasks.length;
        deleteButton.disabled = this.selectedTaskIds.size === 0;
        deleteButton.textContent = `Delete selected (${this.selectedTaskIds.size})`;
      });

      const details = row.createSpan();
      details.createEl("strong", { text: task.content });
      details.createEl("small", { text: this.taskMetadata(task) });
    }

    const actions = this.contentEl.createDiv("modal-button-container");
    const cancelButton = actions.createEl("button", { text: "Cancel" });
    cancelButton.addEventListener("click", () => this.close());
    const deleteButton = actions.createEl("button", {
      text: `Delete selected (${this.selectedTaskIds.size})`,
      cls: "mod-warning",
    });
    deleteButton.disabled = this.selectedTaskIds.size === 0;
    deleteButton.addEventListener("click", () => this.renderConfirmation());
  }

  private taskMetadata(task: Task): string {
    const project = this.projectsById.get(task.project_id) ?? task.project_id;
    const due = task.due
      ? `${task.due.is_recurring ? "Repeats: " : "Due: "}${task.due.string}`
      : "No due date";
    return `${project} · ${due}`;
  }

  private renderConfirmation() {
    const selectedTasks = this.tasks.filter((task) =>
      this.selectedTaskIds.has(task.id),
    );
    this.contentEl.empty();
    this.contentEl.createEl("h2", { text: "Delete selected tasks?" });
    this.contentEl.createEl("p", {
      text: `This permanently deletes ${selectedTasks.length} Todoist task${selectedTasks.length === 1 ? "" : "s"}.`,
    });
    const list = this.contentEl.createEl("ul");
    selectedTasks.forEach((task) =>
      list.createEl("li", { text: task.content }),
    );

    const actions = this.contentEl.createDiv("modal-button-container");
    const backButton = actions.createEl("button", { text: "Back" });
    backButton.addEventListener("click", () => this.renderSelection());
    const confirmButton = actions.createEl("button", {
      text: "Delete",
      cls: "mod-warning",
    });
    confirmButton.addEventListener(
      "click",
      () => void this.deleteSelected(selectedTasks, confirmButton),
    );
  }

  private async deleteSelected(tasks: Task[], button: HTMLButtonElement) {
    button.disabled = true;
    button.textContent = "Deleting...";
    const results = await Promise.allSettled(
      tasks.map((task) => this.service.deleteTask(task.id)),
    );
    const failedNames = results.flatMap((result, index) =>
      result.status === "rejected" ? [tasks[index]!.content] : [],
    );

    if (failedNames.length === 0) {
      new Notice(
        `Deleted ${tasks.length} Todoist task${tasks.length === 1 ? "" : "s"}.`,
      );
      this.close();
      return;
    }

    new Notice(
      `Deleted ${tasks.length - failedNames.length} task(s). Failed: ${failedNames.join(", ")}.`,
    );
    this.renderSelection();
  }
}
