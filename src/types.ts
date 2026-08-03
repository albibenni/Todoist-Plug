import { z } from "zod";

export const TodoistPluginSettingsSchema = z.object({
  defaultProject: z.string().optional(),
  defaultPriority: z.number().min(1).max(4).default(1),
  defaultDate: z.string().default("today"),
  defaultLabels: z.array(z.string()).default([]),
});

export type TodoistPluginSettings = z.infer<typeof TodoistPluginSettingsSchema>;

export const DEFAULT_SETTINGS: TodoistPluginSettings = {
  defaultPriority: 1,
  defaultDate: "today",
  defaultLabels: [],
};

export const TaskSchema = z.object({
  id: z.string(),
  projectId: z.string(),
  content: z.string(),
  description: z.string(),
  isCompleted: z.boolean(),
  labels: z.array(z.string()),
  priority: z.number(),
  commentCount: z.number(),
  createdAt: z.string(),
  url: z.string(),
  creatorId: z.string(),
  due: z
    .object({
      date: z.string(),
      string: z.string(),
      lang: z.string(),
      isRecurring: z.boolean(),
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
  parentId: z.string().nullable(),
  order: z.number(),
  commentCount: z.number(),
  isShared: z.boolean(),
  isFavorite: z.boolean(),
  isInboxProject: z.boolean(),
  isTeamInbox: z.boolean(),
  viewStyle: z.string(),
  url: z.string(),
});

export type Project = z.infer<typeof ProjectSchema>;

export const LabelSchema = z.object({
  id: z.string(),
  name: z.string(),
  color: z.string(),
  order: z.number(),
  isFavorite: z.boolean(),
});

export type Label = z.infer<typeof LabelSchema>;

export const AddTaskArgsSchema = z.object({
  content: z.string(),
  description: z.string().optional(),
  projectId: z.string().optional(),
  sectionId: z.string().optional(),
  parentId: z.string().optional(),
  order: z.number().optional(),
  labels: z.array(z.string()).optional(),
  priority: z.number().optional(),
  dueString: z.string().optional(),
  dueDate: z.string().optional(),
  dueDatetime: z.string().optional(),
  dueLang: z.string().optional(),
  assigneeId: z.string().optional(),
});

export type AddTaskArgs = z.infer<typeof AddTaskArgsSchema>;
