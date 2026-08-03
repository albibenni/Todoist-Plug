import { type RequestUrlParam, requestUrl } from "obsidian";
import { z } from "zod";
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
    const req: RequestUrlParam = {
      url: `https://api.todoist.com/api/v1${endpoint}`,
      method,
      headers: {
        Authorization: `Bearer ${this.token.trim()}`,
      },
      throw: false,
    };

    if (body) {
      if (!req.headers) req.headers = {};
      req.headers["Content-Type"] = "application/json";
      req.body = JSON.stringify(body);
    }

    const res = await requestUrl(req);

    if (res.status >= 400) {
      throw new Error(`Todoist API error: ${res.status} ${res.text}`);
    }

    let data: unknown;
    try {
      data = res.json ?? JSON.parse(res.text);
    } catch (_e) {
      console.error("Failed to parse JSON response:", res.text);
      throw new Error(`Invalid JSON response: ${res.text}`);
    }

    try {
      return schema.parse(data);
    } catch (e) {
      console.error("Zod parse error for Todoist API response:", e);
      // Fallback in case Todoist API structure changes slightly and breaks validation
      return data as T;
    }
  }

  async getProjects(): Promise<Project[]> {
    return await this.request<Project[]>(
      "GET",
      "/projects",
      z.array(ProjectSchema),
    );
  }

  async getLabels(): Promise<Label[]> {
    return await this.request<Label[]>("GET", "/labels", z.array(LabelSchema));
  }

  async getTasks(): Promise<Task[]> {
    return await this.request<Task[]>("GET", "/tasks", z.array(TaskSchema));
  }

  async getTasksByFilter(args: { query: string }): Promise<Task[]> {
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
    // The unified v1 API natively supports natural language via the standard tasks endpoint
    return await this.request<Task>("POST", "/tasks", TaskSchema, {
      content: args.text,
    });
  }
}
