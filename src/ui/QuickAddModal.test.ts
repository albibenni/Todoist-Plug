interface ObsidianElementPrototype {
  empty(this: HTMLElement): void;
  addClass(this: HTMLElement, ...classes: string[]): void;
  setCssStyles(this: HTMLElement, styles: Record<string, string>): void;
  createEl<K extends keyof HTMLElementTagNameMap>(
    this: HTMLElement,
    tag: K,
    options?: { cls?: string | string[]; text?: string; type?: string },
  ): HTMLElementTagNameMap[K];
  createDiv(this: HTMLElement, className?: string): HTMLDivElement;
  createSpan(this: HTMLElement, className?: string): HTMLSpanElement;
}

const elementPrototype =
  HTMLElement.prototype as unknown as ObsidianElementPrototype;

elementPrototype.empty = function () {
  this.replaceChildren();
};
elementPrototype.addClass = function (...classes: string[]) {
  this.classList.add(...classes);
};
elementPrototype.setCssStyles = function (styles: Record<string, string>) {
  Object.assign(this.style, styles);
};
elementPrototype.createEl = function <K extends keyof HTMLElementTagNameMap>(
  this: HTMLElement,
  tag: K,
  options?: { cls?: string | string[]; text?: string; type?: string },
): HTMLElementTagNameMap[K] {
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
elementPrototype.createDiv = function (className) {
  return elementPrototype.createEl.call(this, "div", {
    cls: className,
  }) as HTMLDivElement;
};
elementPrototype.createSpan = function (className) {
  return elementPrototype.createEl.call(this, "span", {
    cls: className,
  }) as HTMLSpanElement;
};

import { describe, expect, it, vi } from "vite-plus/test";

import { QuickAddModal } from "./QuickAddModal";

const settings = {
  defaultPriority: 1,
  defaultDate: "today",
  defaultLabels: [],
};

describe("QuickAddModal", () => {
  it("does not open the virtual keyboard when the project picker opens on mobile", () => {
    vi.useFakeTimers();
    document.body.classList.add("is-mobile");

    try {
      const service = {
        getLabels: vi.fn().mockResolvedValue([]),
        getProjects: vi.fn().mockResolvedValue([]),
      };
      const modal = new QuickAddModal(
        {} as never,
        service as never,
        settings,
        "Mobile task",
      );
      modal.onOpen();

      const titleInput = modal.contentEl.querySelector<HTMLTextAreaElement>(
        ".task-name textarea",
      );
      const focusTitle = vi.spyOn(titleInput!, "focus");

      const projectButton =
        modal.contentEl.querySelector<HTMLButtonElement>(".project-selector");
      projectButton?.click();

      const searchInput = document.body.querySelector<HTMLInputElement>(
        ".task-project-menu input",
      );
      const focusSearch = vi.spyOn(searchInput!, "focus");
      vi.runAllTimers();

      expect(focusTitle).not.toHaveBeenCalled();
      expect(focusSearch).not.toHaveBeenCalled();
      modal.onClose();
    } finally {
      document.body.classList.remove("is-mobile");
      vi.useRealTimers();
    }
  });

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
