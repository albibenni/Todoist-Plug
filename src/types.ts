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

// API validation schema
export const TodoistResponseSchema = z.union([
  z.object({ results: z.array(z.any()) }),
  z.array(z.any()),
]);
