import type {
  AddTaskArgs,
  Project,
  Task,
  TodoistApi,
} from "@doist/todoist-sdk";

export class TodoistService {
  constructor(private api: TodoistApi) {}

  async addQuickTask(text: string): Promise<Task> {
    if (!text.trim()) {
      throw new Error("Task text cannot be empty");
    }

    try {
      return await this.api.quickAddTask({ text });
    } catch (error) {
      console.error("Failed to add quick task:", error);
      throw new Error("Failed to add task to Todoist");
    }
  }

  async fetchTasks(filter?: string): Promise<Task[]> {
    try {
      if (filter) {
        return (await this.api.getTasksByFilter({ query: filter })).results;
      }
      return (await this.api.getTasks()).results;
    } catch (error) {
      console.error("Failed to fetch tasks:", error);
      throw new Error("Failed to fetch tasks from Todoist");
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
    try {
      const res = await this.api.getProjects();
      return (res as any).results || res;
    } catch (error) {
      console.error("Failed to get projects:", error);
      throw new Error("Failed to get projects from Todoist");
    }
  }
}
