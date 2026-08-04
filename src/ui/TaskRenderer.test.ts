// biome-ignore lint/suspicious/noExplicitAny: mock
(HTMLElement.prototype as any).createEl = function (
  tag: string,
  // biome-ignore lint/suspicious/noExplicitAny: mock
  options?: any,
) {
  const el = document.createElement(tag);
  if (options) {
    if (options.cls) {
      if (Array.isArray(options.cls)) {
        el.classList.add(...options.cls);
      } else {
        el.classList.add(options.cls);
      }
    }
    if (options.text) {
      el.textContent = options.text;
    }
    if (options.type) {
      // biome-ignore lint/suspicious/noExplicitAny: mock
      (el as any).type = options.type;
    }
  }
  this.appendChild(el);
  return el;
};
// biome-ignore lint/suspicious/noExplicitAny: mock
(HTMLElement.prototype as any).createSpan = function (options?: any) {
  return this.createEl("span", options);
};
// biome-ignore lint/suspicious/noExplicitAny: mock
(HTMLElement.prototype as any).createDiv = function (options?: any) {
  return this.createEl("div", options);
};

import { describe, expect, it } from "vitest";
import type { Task } from "../api";
import { TaskRenderer } from "./TaskRenderer";

const createMockTask = (overrides: Partial<Task>): Task => ({
  id: "1",
  project_id: "1",
  content: "Test task",
  description: "",
  checked: false,
  labels: [],
  priority: 1,
  note_count: 0,
  added_at: "2023-10-27T10:00:00Z",
  user_id: "1",
  ...overrides,
});

describe("TaskRenderer", () => {
  const mockTask1 = createMockTask({
    id: "1",
    content: "Buy milk",
    checked: false,
    priority: 1, // P4
  });

  const mockTask2 = createMockTask({
    id: "2",
    content: "Urgent meeting",
    checked: true,
    priority: 4, // P1
    due: {
      string: "Today at 10am",
      date: "2023-10-27",
      is_recurring: false,
      timezone: undefined,
      lang: "",
    },
  });

  describe("renderMarkdown", () => {
    it("should render empty state when no tasks are provided", () => {
      expect(TaskRenderer.renderMarkdown([])).toBe("*No tasks found.*");
    });

    it("should render a basic uncompleted task correctly", () => {
      const result = TaskRenderer.renderMarkdown([mockTask1]);
      expect(result).toContain("- [ ] Buy milk");
      expect(result).toContain("[🔗](https://todoist.com/showTask?id=1)");
      expect(result).not.toContain("**(p");
      expect(result).not.toContain("📅");
    });

    it("should render a complex completed task correctly (priority and due date)", () => {
      const result = TaskRenderer.renderMarkdown([mockTask2]);
      expect(result).toContain("- [x] Urgent meeting");
      expect(result).toContain("**(p1)**"); // priority 4 maps to p1
      expect(result).toContain("📅 *Oct 27*");
    });
  });

  describe("renderHTML", () => {
    it("should create empty state paragraph", () => {
      const container = document.createElement("div");
      TaskRenderer.renderHTML([], container);
      expect(container.querySelector("p")?.textContent).toBe("No tasks found.");
      expect(container.querySelector(".todoist-empty-state")).not.toBeNull();
    });

    it("should create list items for tasks", () => {
      const container = document.createElement("div");
      TaskRenderer.renderHTML([mockTask1, mockTask2], container);

      const items = container.querySelectorAll("li");
      expect(items.length).toBe(2);

      const firstItem = items[0];
      const checkbox = firstItem?.querySelector(
        'input[type="checkbox"]',
      ) as HTMLInputElement;
      expect(checkbox).not.toBeNull();
      expect(checkbox.checked).toBe(false);
      expect(
        firstItem?.querySelector(".todoist-task-content")?.textContent,
      ).toBe("Buy milk");

      const secondItem = items[1];
      const secondCheckbox = secondItem?.querySelector(
        'input[type="checkbox"]',
      ) as HTMLInputElement;
      expect(secondCheckbox.checked).toBe(true);
      expect(secondItem?.querySelector(".todoist-task-due")?.textContent).toBe(
        "Oct 27",
      );
    });
  });
});
