import type { App } from "obsidian";
import { beforeAll, describe, expect, it, vi } from "vitest";
import type { Task } from "../api";
import type { TodoistService } from "../services/TodoistService";
import { MatchingTasksModal } from "./MatchingTasksModal";

beforeAll(() => {
  const prototype = HTMLElement.prototype as unknown as {
    appendText(text: string): void;
    createDiv(className?: string): HTMLDivElement;
    createEl<K extends keyof HTMLElementTagNameMap>(
      tag: K,
      options?: { cls?: string; text?: string; type?: string },
    ): HTMLElementTagNameMap[K];
    createSpan(): HTMLSpanElement;
    empty(): void;
  };
  prototype.empty = function (this: HTMLElement) {
    this.replaceChildren();
  };
  prototype.appendText = function (this: HTMLElement, text) {
    this.append(document.createTextNode(text));
  };
  prototype.createEl = function (this: HTMLElement, tag, options = {}) {
    const element = document.createElement(tag);
    if (options.cls) element.className = options.cls;
    if (options.text) element.textContent = options.text;
    if (options.type && element instanceof HTMLInputElement) {
      element.type = options.type;
    }
    this.append(element);
    return element;
  };
  prototype.createDiv = function (this: HTMLElement, className) {
    return prototype.createEl.call(this, "div", {
      cls: className,
    }) as HTMLDivElement;
  };
  prototype.createSpan = function (this: HTMLElement) {
    return prototype.createEl.call(this, "span") as HTMLSpanElement;
  };
});

describe("MatchingTasksModal", () => {
  it("requires task selection before showing a deletion confirmation", async () => {
    const tasks: Task[] = [
      {
        id: "task-1",
        content: "Weekly review",
        project_id: "project-1",
        due: {
          date: "2026-09-08",
          string: "every Tuesday",
          lang: "en",
          is_recurring: true,
        },
      },
    ];
    const service = {
      getProjects: vi
        .fn()
        .mockResolvedValue([{ id: "project-1", name: "Work" }]),
      deleteTask: vi.fn(),
    } as unknown as TodoistService;
    const modal = new MatchingTasksModal({} as App, service, tasks);

    modal.onOpen();
    await new Promise((resolve) => setTimeout(resolve, 0));

    const checkbox = modal.contentEl.querySelector<HTMLInputElement>(
      ".todoist-matching-task input",
    );
    let deleteButton = Array.from(
      modal.contentEl.querySelectorAll<HTMLButtonElement>("button"),
    ).find((button) => button.textContent?.startsWith("Delete selected"));

    expect(checkbox?.checked).toBe(false);
    expect(deleteButton?.disabled).toBe(true);

    if (!checkbox) throw new Error("Task checkbox was not rendered");
    checkbox.checked = true;
    checkbox.dispatchEvent(new Event("change"));
    deleteButton = Array.from(
      modal.contentEl.querySelectorAll<HTMLButtonElement>("button"),
    ).find((button) => button.textContent?.startsWith("Delete selected"));
    expect(deleteButton?.textContent).toBe("Delete selected (1)");
    deleteButton?.click();

    expect(modal.contentEl.textContent).toContain("Delete selected tasks?");
    expect(modal.contentEl.textContent).toContain("Weekly review");
  });
});
