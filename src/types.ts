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
  description: z.string().optional(),
  checked: z.boolean().optional(),
  labels: z.array(z.string()).optional(),
  priority: z.number().optional(),
  note_count: z.number().optional(),
  added_at: z.string().optional(),
  user_id: z.string().optional(),
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
  color: z.string().optional(),
  parent_id: z.string().nullable().optional(),
  child_order: z.number().optional(),
  is_shared: z.boolean().optional(),
  is_favorite: z.boolean().optional(),
  inbox_project: z.boolean().optional(),
  view_style: z.string().optional(),
});

export type Project = z.infer<typeof ProjectSchema>;

export const LabelSchema = z.object({
  id: z.string(),
  name: z.string(),
  color: z.string().optional(),
  order: z.number().optional(),
  is_favorite: z.boolean().optional(),
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
