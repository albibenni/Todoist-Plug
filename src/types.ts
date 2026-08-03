import { z } from "zod";

export const TodoistPluginSettingsSchema = z.object({
  apiToken: z.string().optional(),
  defaultProject: z.string().optional(),
  defaultPriority: z.number().min(1).max(4).default(1),
  defaultDate: z.string().default("today"),
  defaultLabels: z.array(z.string()).default([]),
});

export type TodoistPluginSettings = z.infer<typeof TodoistPluginSettingsSchema>;

export const DEFAULT_SETTINGS: TodoistPluginSettings = {
  apiToken: "",
  defaultPriority: 1,
  defaultDate: "today",
  defaultLabels: [],
};

export const TaskSchema = z.object({
  id: z.string(),
  project_id: z.string(),
  content: z.string(),
  description: z.string(),
  is_completed: z.boolean(),
  labels: z.array(z.string()),
  priority: z.number(),
  comment_count: z.number(),
  created_at: z.string(),
  url: z.string(),
  creator_id: z.string(),
  due: z
    .object({
      date: z.string(),
      string: z.string(),
      lang: z.string(),
      is_recurring: z.boolean(),
      timezone: z.string().nullable().optional(),
    })
    .nullable()
    .optional(),
});

export type Task = z.infer<typeof TaskSchema>;

export const ProjectSchema = z.object({
  id: z.string(),
  name: z.string(),
  color: z.string(),
  parent_id: z.string().nullable(),
  order: z.number(),
  comment_count: z.number(),
  is_shared: z.boolean(),
  is_favorite: z.boolean(),
  is_inbox_project: z.boolean(),
  is_team_inbox: z.boolean(),
  view_style: z.string(),
  url: z.string(),
});

export type Project = z.infer<typeof ProjectSchema>;

export const LabelSchema = z.object({
  id: z.string(),
  name: z.string(),
  color: z.string(),
  order: z.number(),
  is_favorite: z.boolean(),
});

export type Label = z.infer<typeof LabelSchema>;

export const AddTaskArgsSchema = z.object({
  content: z.string(),
  description: z.string().optional(),
  project_id: z.string().optional(),
  section_id: z.string().optional(),
  parent_id: z.string().optional(),
  order: z.number().optional(),
  labels: z.array(z.string()).optional(),
  priority: z.number().optional(),
  due_string: z.string().optional(),
  due_date: z.string().optional(),
  due_datetime: z.string().optional(),
  due_lang: z.string().optional(),
  assignee_id: z.string().optional(),
});

export type AddTaskArgs = z.infer<typeof AddTaskArgsSchema>;
