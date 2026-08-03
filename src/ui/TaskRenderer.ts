import type { Project, Task } from "@doist/todoist-sdk";

export class TaskRenderer {
  /**
   * Helper to format YYYY-MM-DD into human-readable absolute dates
   */
  static formatDate(dateString: string): {
    text: string;
    isOverdue: boolean;
    isToday: boolean;
  } {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const match = dateString.match(/^(\d{4})-(\d{2})-(\d{2})/);
      if (!match) {
        return { text: dateString, isOverdue: false, isToday: false };
      }

      const year = parseInt(match[1] as string, 10);
      const month = parseInt(match[2] as string, 10);
      const day = parseInt(match[3] as string, 10);

      const date = new Date(year, month - 1, day);
      date.setHours(0, 0, 0, 0);

      const diffTime = date.getTime() - today.getTime();
      const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

      const isOverdue = diffDays < 0;
      const isToday = diffDays === 0;

      let text = "";
      if (diffDays === 0) text = "Today";
      else if (diffDays === 1) text = "Tomorrow";
      else if (diffDays === -1) text = "Yesterday";
      else {
        text = date.toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
        });
      }

      return { text, isOverdue, isToday };
    } catch {
      return { text: dateString, isOverdue: false, isToday: false };
    }
  }

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
        if (task.due && task.due.date) {
          const { text } = TaskRenderer.formatDate(task.due.date);
          taskString += ` 📅 *${text}*`;
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
  static renderHTML(
    tasks: Task[],
    container: HTMLElement,
    projects: Project[] = [],
  ): void {
    container.innerHTML = "";

    if (!tasks || tasks.length === 0) {
      const p = createEl("p");
      p.textContent = "No tasks found.";
      p.classList.add("todoist-empty-state");
      container.appendChild(p);
      return;
    }

    const ul = createEl("ul");
    ul.classList.add("todoist-task-list");

    const projectsMap = Object.fromEntries(projects.map((p) => [p.id, p]));

    tasks.forEach((task) => {
      const li = createEl("li");
      li.classList.add("todoist-task-item");
      li.classList.add(`todoist-priority-${task.priority}`);

      const checkbox = createEl("input");
      checkbox.type = "checkbox";
      checkbox.checked = !!task.completedAt;
      checkbox.disabled = true; // For now, read-only
      li.appendChild(checkbox);

      const span = createEl("span");
      span.textContent = task.content;
      span.classList.add("todoist-task-content");
      li.appendChild(span);

      const metadataContainer = createEl("span");
      metadataContainer.classList.add("todoist-task-metadata");

      const project = task.projectId ? projectsMap[task.projectId] : undefined;
      if (project) {
        const projectSpan = createEl("span");
        projectSpan.textContent = `#${project.name}`;
        projectSpan.classList.add("todoist-task-project");
        // Use a simple hash for color mapping if desired, or let CSS handle it
        metadataContainer.appendChild(projectSpan);
      }

      if (task.due && task.due.date) {
        const { text, isOverdue, isToday } = TaskRenderer.formatDate(
          task.due.date,
        );
        const dueSpan = createEl("span");

        // If it's recurring, optionally append the recurrence text, but keep it clean
        dueSpan.textContent = task.due.isRecurring ? `${text} 🔁` : text;
        dueSpan.classList.add("todoist-task-due");

        if (isOverdue) dueSpan.classList.add("todoist-overdue");
        if (isToday) dueSpan.classList.add("todoist-today");

        metadataContainer.appendChild(dueSpan);
      }

      if (metadataContainer.children.length > 0) {
        li.appendChild(metadataContainer);
      }

      ul.appendChild(li);
    });

    container.appendChild(ul);
  }
}
