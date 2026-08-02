import type { Task } from "@doist/todoist-sdk";

export class TaskRenderer {
  /**
   * Renders a list of Todoist tasks into a Markdown list representation.
   */
  static renderMarkdown(tasks: Task[]): string {
    if (!tasks || tasks.length === 0) {
      return "*No tasks found.*";
    }

    return tasks
      .map((task) => {
        const checkbox = task.completedAt ? "[x]" : "[ ]";

        // Build the task string
        let taskString = `- ${checkbox} ${task.content}`;

        // Append priority if higher than 1 (1 is normal)
        if (task.priority > 1) {
          const p = 5 - task.priority; // Todoist API priority is inverted (4 = P1, 3 = P2, 2 = P3, 1 = P4)
          taskString += ` **(p${p})**`;
        }

        // Append due date if it exists
        if (task.due && task.due.string) {
          taskString += ` 📅 *${task.due.string}*`;
        }

        // Add a direct link to the task in the web app
        if (task.url) {
          taskString += ` [🔗](${task.url})`;
        }

        return taskString;
      })
      .join("\n");
  }

  /**
   * Renders tasks into an HTML element structure using standard DOM API
   */
  static renderHTML(tasks: Task[], container: HTMLElement): void {
    container.innerHTML = "";

    if (!tasks || tasks.length === 0) {
      const p = document.createElement("p");
      p.textContent = "No tasks found.";
      p.classList.add("todoist-empty-state");
      container.appendChild(p);
      return;
    }

    const ul = document.createElement("ul");
    ul.classList.add("todoist-task-list");

    tasks.forEach((task) => {
      const li = document.createElement("li");
      li.classList.add("todoist-task-item");

      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.checked = !!task.completedAt;
      checkbox.disabled = true; // For now, read-only
      li.appendChild(checkbox);

      const span = document.createElement("span");
      span.textContent = task.content;
      span.classList.add("todoist-task-content");
      li.appendChild(span);

      if (task.due && task.due.string) {
        const dueSpan = document.createElement("span");
        dueSpan.textContent = task.due.string;
        dueSpan.classList.add("todoist-task-due");
        li.appendChild(dueSpan);
      }

      ul.appendChild(li);
    });

    container.appendChild(ul);
  }
}
