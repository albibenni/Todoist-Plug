import type { AddTaskArgs, Label, Project, Task, TodoistApi } from "../api";

export class TodoistService {
  private projectsCache: Project[] | null = null;
  private projectsCacheTime = 0;

  constructor(private api: TodoistApi) {}

  async addQuickTask(text: string, settings?: { project_id?: string; due_string?: string; priority?: number; labels?: string[] }): Promise<Task> {
    if (!text.trim()) {
      throw new Error("Task text cannot be empty");
    }

    try {
      return await this.api.quickAddTask({ text, ...settings });
    } catch (error) {
      console.error("Failed to add quick task:", error);
      throw new Error("Failed to add task to Todoist");
    }
  }

  async fetchTasks(filter?: string): Promise<Task[]> {
    try {
      if (filter) {
        return await this.api.getTasksByFilter({ query: filter });
      }
      return await this.api.getTasks();
    } catch (error) {
      console.error("Failed to fetch tasks:", error);
      throw new Error("Failed to fetch tasks from Todoist");
    }
  }

  async checkTaskExists(content: string, filename?: string): Promise<boolean> {
    try {
      const sanitized = content
        .replace(
          /(#[^\s]+|@[^\s]+|p[1-4]|\b(today|tomorrow|in \d+ days?|in \d+ weeks?)\b)/gi,
          "",
        )
        .trim();

      const searchTarget = (sanitized || content).toLowerCase();

      // Query Todoist using the exact same 'search:' syntax as the user's script
      const tasks = await this.fetchTasks(`search: ${searchTarget}`);
      let exists = tasks.some((t) =>
        t.content.toLowerCase().includes(searchTarget),
      );

      if (!exists && filename) {
        const fileTasks = await this.fetchTasks(`search: ${filename}`);
        exists = fileTasks.some((t) =>
          t.content.toLowerCase().includes(filename.toLowerCase()),
        );
      }

      return exists;
    } catch (error) {
      console.error("Failed to check task existence:", error);
      return false;
    }
  }

  async addTask(args: AddTaskArgs): Promise<Task> {
    try {
      return await this.api.addTask(args);
    } catch (error) {
      console.error("Failed to add task:", error);
      throw new Error("Failed to add task to Todoist");
    }
  }

  async getProjects(): Promise<Project[]> {
    const now = Date.now();
    if (this.projectsCache && now - this.projectsCacheTime < 300000) {
      return this.projectsCache;
    }
    try {
      const projects = await this.api.getProjects();
      this.projectsCache = projects;
      this.projectsCacheTime = now;
      return projects;
    } catch (error) {
      console.error("Failed to get projects:", error);
      throw new Error("Failed to get projects from Todoist");
    }
  }

  async getLabels(): Promise<Label[]> {
    try {
      return await this.api.getLabels();
    } catch (error) {
      console.error("Failed to get labels:", error);
      throw new Error("Failed to get labels from Todoist");
    }
  }
}
