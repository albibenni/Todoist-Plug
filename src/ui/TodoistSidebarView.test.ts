// biome-ignore lint/suspicious/noExplicitAny: Obsidian DOM helpers test shim
const elementPrototype = HTMLElement.prototype as any;

elementPrototype.empty = function () {
  this.replaceChildren();
};
elementPrototype.addClass = function (...classes: string[]) {
  this.classList.add(...classes);
};
elementPrototype.createEl = function (
  tag: string,
  options?: { cls?: string | string[]; text?: string; type?: string },
) {
  const element = document.createElement(tag);
  if (options?.cls) {
    element.classList.add(
      ...(Array.isArray(options.cls) ? options.cls : [options.cls]),
    );
  }
  if (options?.text) element.textContent = options.text;
  if (options?.type) element.setAttribute("type", options.type);
  this.appendChild(element);
  return element;
};
elementPrototype.createSpan = function (options?: {
  cls?: string;
  text?: string;
}) {
  return this.createEl("span", options);
};

import { describe, expect, it, vi } from "vitest";
import { TodoistSidebarView } from "./TodoistSidebarView";

describe("TodoistSidebarView", () => {
  it("shows a configuration message without an authenticated service", async () => {
    const view = new TodoistSidebarView(
      {} as never,
      {
        todoistService: null,
      } as never,
    );
    const container = document.createElement("div");

    await view.renderTasks(container);

    expect(container.textContent).toContain(
      "Please configure your Todoist API token",
    );
  });

  it("renders the fetched tasks", async () => {
    const service = {
      fetchTasks: vi
        .fn()
        .mockResolvedValue([
          { id: "1", project_id: "p1", content: "Today task" },
        ]),
      getProjects: vi.fn().mockResolvedValue([{ id: "p1", name: "Work" }]),
    };
    const view = new TodoistSidebarView(
      {} as never,
      {
        todoistService: service,
      } as never,
    );
    const container = document.createElement("div");

    await view.renderTasks(container);

    expect(service.fetchTasks).toHaveBeenCalledWith("today | overdue");
    expect(container.querySelector(".todoist-task-content")?.textContent).toBe(
      "Today task",
    );
    expect(container.textContent).toContain("#Work");
  });
});
