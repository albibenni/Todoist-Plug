import type {
  AddTaskArgs,
  Label,
  Project,
  Task,
  TodoistApi,
} from "@doist/todoist-sdk";
import { TodoistResponseSchema } from "../types";

function extractArray<T>(res: unknown): T[] {
  const parsed = TodoistResponseSchema.safeParse(res);
  if (parsed.success) {
    if ("results" in parsed.data) {
      return parsed.data.results as T[];
    }
    return parsed.data as T[];
  }
  // Fallback if the SDK changes shape entirely
  return [];
}

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
        return extractArray<Task>(
          await this.api.getTasksByFilter({ query: filter }),
        );
      }
      return extractArray<Task>(await this.api.getTasks());
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
      return extractArray<Project>(await this.api.getProjects());
    } catch (error) {
      console.error("Failed to get projects:", error);
      throw new Error("Failed to get projects from Todoist");
    }
  }

  async getLabels(): Promise<Label[]> {
    try {
      return extractArray<Label>(await this.api.getLabels());
    } catch (error) {
      console.error("Failed to get labels:", error);
      throw new Error("Failed to get labels from Todoist");
    }
  }
}
