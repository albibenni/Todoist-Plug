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

    return schema.parse(data);
  }

  async getProjects(): Promise<Project[]> {
    return await this.request<Project[]>(
      "GET",
      "/projects",
      z.union([
        z.array(ProjectSchema),
        z
          .object({ results: z.array(ProjectSchema) })
          .transform((d) => d.results),
      ]),
    );
  }

  async getLabels(): Promise<Label[]> {
    return await this.request<Label[]>(
      "GET",
      "/labels",
      z.union([
        z.array(LabelSchema),
        z.object({ results: z.array(LabelSchema) }).transform((d) => d.results),
      ]),
    );
  }

  async getTasks(): Promise<Task[]> {
    return await this.request<Task[]>(
      "GET",
      "/tasks",
      z.union([
        z.array(TaskSchema),
        z.object({ results: z.array(TaskSchema) }).transform((d) => d.results),
      ]),
    );
  }

  //TODO:
  /*
     Get Tasks By Filter
Get all tasks matching the filter.

This is a paginated endpoint. See the Pagination guide for details on using cursor-based pagination.

query Parameters
queryrequired
string (Query) [ 1 .. 1024 ] characters
Examples: query=today | overdue
Filter by any supported filter. Multiple filters (using the comma , operator) are not supported.

lang
Lang (string) or Lang (null) (Lang)
Examples: lang=en lang=de lang=fr
IETF language tag defining what language filter is written in, if differs from default English

cursor
Cursor (string) or Cursor (null) (Cursor)
limit
integer (Limit) ( 0 .. 200 ]
Default: 50
Examples: limit=50
The number of objects to return in a page
*/
  async getTasksByFilter(args: { query: string }): Promise<Task[]> {
    return await this.request<Task[]>(
      "GET",
      `/tasks?filter=${encodeURIComponent(args.query)}`,
      z.union([
        z.array(TaskSchema),
        z.object({ results: z.array(TaskSchema) }).transform((d) => d.results),
      ]),
    );
  }
  //TODO: add task
  //   post
  // /api/v1/tasks
  // https://api.todoist.com/api/v1/tasks
  // Request samples
  // Payload
  // Content type
  // application/json
  //
  // Copy
  // Expand allCollapse all
  // {
  // "content": "Buy milk",
  // "description": "Pick up two liters of whole milk.",
  // "project_id": "6XGgm6PHrGgMpCFX",
  // "section_id": "6fFPHV272WWh3gpW",
  // "parent_id": "6XGgmFVcrG5RRjVr",
  // "order": 12,
  // "labels": [
  // "errands",
  // "shopping"
  // ],
  // "priority": 2,
  // "assignee_id": 123456789,
  // "due_string": "tomorrow at 12:00",
  // "due_date": "2025-02-12",
  // "due_datetime": "2025-02-12T12:00:00Z",
  // "due_lang": "en",
  // "duration": 30,
  // "duration_unit": "minute",
  // "deadline_date": "2025-02-12"
  // }
  // Response samples
  // 200
  // Content type
  // application/json
  //
  // Copy
  // Expand allCollapse all
  // {
  // "user_id": "1234567",
  // "id": "6XGgmFVcrG5RRjVr",
  // "project_id": "6XGgm6PHrGgMpCFX",
  // "section_id": "6fFPHV272WWh3gpW",
  // "parent_id": "6XGgmFVcrG5RRjVr",
  // "added_by_uid": "1234567",
  // "assigned_by_uid": "1234567",
  // "responsible_uid": "1234567",
  // "labels": [
  // "priority"
  // ],
  // "deadline": {
  // "date": "2025-02-12",
  // "lang": "en"
  // },
  // "duration": {
  // "amount": 30,
  // "unit": "minute"
  // },
  // "is_collapsed": false,
  // "checked": false,
  // "is_deleted": false,
  // "added_at": "2025-01-15T10:30:00Z",
  // "completed_at": "2025-01-16T10:30:00Z",
  // "completed_by_uid": "1234567",
  // "updated_at": "2025-01-17T10:30:00Z",
  // "due": {
  // "date": "2025-02-12",
  // "is_recurring": false,
  // "lang": "en",
  // "string": "tomorrow"
  // },
  // "priority": 1,
  // "child_order": 1,
  // "content": "Buy milk",
  // "description": "Pick up organic milk",
  // "note_count": 0,
  // "day_order": 1,
  // "completed_count": 3,
  // "postponed_count": 1
  // }
  async addTask(args: AddTaskArgs): Promise<Task> {
    return await this.request<Task>("POST", "/tasks", TaskSchema, args);
  }

  async quickAddTask(args: {
    text: string;
    project_id?: string;
    due_string?: string;
    priority?: number;
    labels?: string[];
  }): Promise<Task> {
    const payload: Record<string, unknown> = {
      content: args.text,
      project_id: args.project_id,
      due_string: args.due_string,
      priority: args.priority,
      labels: args.labels,
    };
    Object.keys(payload).forEach(
      (key) => payload[key] === undefined && delete payload[key],
    );

    return await this.request<Task>(
      "POST",
      "/tasks/quick",
      TaskSchema,
      payload,
    );
  }
}
