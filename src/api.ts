import { requestUrl } from "obsidian";
import type { z } from "zod";
import {
  type AddTaskArgs,
  type Label,
  LabelSchema,
  type Project,
  ProjectSchema,
  type Task,
  TaskSchema,
} from "./types";

export type { AddTaskArgs, Label, Project, Task };

export class TodoistApi {
  constructor(private token: string) {}

  private async request<T>(
    method: "GET" | "POST",
    endpoint: string,
    schema: z.ZodType<T>,
    body?: unknown,
  ): Promise<T> {
    const res = await requestUrl({
      url: `https://api.todoist.com/rest/v2${endpoint}`,
      method,
      headers: {
        Authorization: `Bearer ${this.token}`,
        "Content-Type": "application/json",
      },
      body: body ? JSON.stringify(body) : undefined,
      throw: false,
    });

    if (res.status >= 400) {
      throw new Error(`Todoist API error: ${res.status} ${res.text}`);
    }

    try {
      return schema.parse(res.json);
    } catch (e) {
      console.error("Zod parse error for Todoist API response:", e);
      // Fallback in case Todoist API structure changes slightly and breaks validation
      return res.json as T;
    }
  }

  async getProjects(): Promise<Project[]> {
    const { z } = await import("zod");
    return await this.request<Project[]>(
      "GET",
      "/projects",
      z.array(ProjectSchema),
    );
  }

  async getLabels(): Promise<Label[]> {
    const { z } = await import("zod");
    return await this.request<Label[]>("GET", "/labels", z.array(LabelSchema));
  }

  async getTasks(): Promise<Task[]> {
    const { z } = await import("zod");
    return await this.request<Task[]>("GET", "/tasks", z.array(TaskSchema));
  }

  async getTasksByFilter(args: { query: string }): Promise<Task[]> {
    const { z } = await import("zod");
    return await this.request<Task[]>(
      "GET",
      `/tasks?filter=${encodeURIComponent(args.query)}`,
      z.array(TaskSchema),
    );
  }

  async addTask(args: AddTaskArgs): Promise<Task> {
    return await this.request<Task>("POST", "/tasks", TaskSchema, args);
  }

  async quickAddTask(args: { text: string }): Promise<Task> {
    const res = await requestUrl({
      url: "https://api.todoist.com/sync/v9/quick/add",
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text: args.text }),
      throw: false,
    });

    if (res.status >= 400) {
      throw new Error(`Todoist API error: ${res.status} ${res.text}`);
    }

    try {
      return TaskSchema.parse(res.json);
    } catch (e) {
      console.error("Zod parse error for Todoist Quick Add response:", e);
      return res.json as Task;
    }
  }
}
