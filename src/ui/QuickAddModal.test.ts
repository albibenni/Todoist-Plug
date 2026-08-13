// biome-ignore lint/suspicious/noExplicitAny: Obsidian DOM helpers test shim
const elementPrototype = HTMLElement.prototype as any;

elementPrototype.empty = function () {
  this.replaceChildren();
};
elementPrototype.addClass = function (...classes: string[]) {
  this.classList.add(...classes);
};
elementPrototype.setCssStyles = function (styles: Record<string, string>) {
  Object.assign(this.style, styles);
};
elementPrototype.createEl = function (
  tag: string,
  options?: { cls?: string | string[]; text?: string; type?: string },
) {
  const element = document.createElement(tag);
  if (options?.cls) {
    element.classList.add(
      ...(Array.isArray(options.cls)
        ? options.cls
        : options.cls.split(" ").filter(Boolean)),
    );
  }
  if (options?.text) element.textContent = options.text;
  if (options?.type) element.setAttribute("type", options.type);
  this.appendChild(element);
  return element;
};
elementPrototype.createDiv = function (options?: string) {
  return this.createEl("div", { cls: options });
};
elementPrototype.createSpan = function (options?: string) {
  return this.createEl("span", { cls: options });
};

import { describe, expect, it, vi } from "vitest";
import { QuickAddModal } from "./QuickAddModal";

const settings = {
  defaultPriority: 1,
  defaultDate: "today",
  defaultLabels: [],
};

describe("QuickAddModal", () => {
  it("submits only once while a task request is in flight", async () => {
    let finishRequest: (() => void) | undefined;
    const service = {
      getLabels: vi.fn().mockResolvedValue([]),
      getProjects: vi.fn().mockResolvedValue([]),
      addTask: vi.fn(
        () =>
          new Promise<void>((resolve) => {
            finishRequest = resolve;
          }),
      ),
    };
    const modal = new QuickAddModal(
      {} as never,
      service as never,
      settings,
      "Ship the fix",
    );
    modal.onOpen();
    const submit = (modal as unknown as { submitTask: () => Promise<void> })
      .submitTask;

    const firstSubmission = submit.call(modal);
    await submit.call(modal);

    expect(service.addTask).toHaveBeenCalledTimes(1);
    finishRequest?.();
    await firstSubmission;
  });

  it("omits a due date when the default is No date", async () => {
    const service = {
      getLabels: vi.fn().mockResolvedValue([]),
      getProjects: vi.fn().mockResolvedValue([]),
      addTask: vi.fn().mockResolvedValue({}),
    };
    const modal = new QuickAddModal(
      {} as never,
      service as never,
      { ...settings, defaultDate: "no date" },
      "Inbox task",
    );
    modal.onOpen();

    await (
      modal as unknown as { submitTask: () => Promise<void> }
    ).submitTask();

    expect(service.addTask).toHaveBeenCalledWith(
      expect.objectContaining({ content: "Inbox task", due_string: undefined }),
    );
  });
});
