import type { AddTaskArgs, Label, Project } from "@doist/todoist-sdk";
import { App, Menu, Modal, Notice, setIcon } from "obsidian";
import type { TodoistService } from "../services/TodoistService";
import type { TodoistPluginSettings } from "../types";

export class QuickAddModal extends Modal {
  private taskTitle = "";
  private taskDesc = "";
  private dueDate = "";
  private priority = 1;
  private projectId = "";
  private labels: string[] = [];

  private service: TodoistService;
  private initialUrl: string;

  constructor(
    app: App,
    service: TodoistService,
    settings: TodoistPluginSettings,
    initialTitle: string = "",
    initialUrl: string = "",
  ) {
    super(app);
    this.service = service;

    this.initialUrl = initialUrl;

    this.taskTitle = initialTitle;
    this.dueDate = settings.defaultDate || "today";
    this.priority = settings.defaultPriority || 1;
    this.projectId = settings.defaultProject || "";
    this.labels = [...(settings.defaultLabels || [])];
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.empty();

    const root = contentEl.createDiv("task-creation-modal-root");

    const TODOIST_COLORS: Record<string, string> = {
      berry_red: "#b8256f",
      red: "#db4035",
      orange: "#ff9933",
      yellow: "#fad000",
      olive_green: "#afb83b",
      lime_green: "#7ecc49",
      green: "#299438",
      mint_green: "#6accbc",
      teal: "#158fad",
      sky_blue: "#14aaf5",
      light_blue: "#96c3eb",
      blue: "#4073ff",
      grape: "#884dff",
      violet: "#af38eb",
      lavender: "#eb96eb",
      magenta: "#e05194",
      salmon: "#ff8d85",
      charcoal: "#808080",
      grey: "#b8b8b8",
      taupe: "#ccac93",
    };

    let labelsCache: Label[] = [];
    this.service.getLabels().then((labels) => {
      labelsCache = labels;
    });

    // Title
    const nameGroup = root.createDiv("task-content-input task-name");
    const titleInput = nameGroup.createEl("textarea");
    titleInput.placeholder = "Task name";
    titleInput.value = this.taskTitle;
    titleInput.rows = 1;
    titleInput.addEventListener("input", (e) => {
      this.taskTitle = (e.target as HTMLTextAreaElement).value;
      this.autoResizeTextarea(titleInput);
    });

    // Description
    const descGroup = root.createDiv("task-content-input task-description");
    const descInput = descGroup.createEl("textarea");
    descInput.placeholder = "Description";
    descInput.value = this.taskDesc;
    descInput.rows = 1;
    descInput.addEventListener("input", (e) => {
      this.taskDesc = (e.target as HTMLTextAreaElement).value;
      this.autoResizeTextarea(descInput);
    });

    // Selectors
    const selectors = root.createDiv("task-creation-selectors");
    const groupLeft = selectors.createDiv("task-creation-selectors-group");

    const dateContainer = groupLeft.createDiv();
    dateContainer.style.position = "relative";

    const dateBtn = dateContainer.createEl("button");
    const dateBtnIcon = dateBtn.createSpan("obsidian-icon");
    setIcon(dateBtnIcon, "calendar");
    const dateLabel = this.dueDate
      ? this.dueDate.charAt(0).toUpperCase() + this.dueDate.slice(1)
      : "Today";
    const dateLabelSpan = dateBtn.createSpan("date-label");
    dateLabelSpan.textContent = dateLabel;

    dateBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      this.showDatePopover(dateContainer, dateBtn);
    });

    const priorities = [
      { val: 1, text: "Priority 4" },
      { val: 2, text: "Priority 3" },
      { val: 3, text: "Priority 2" },
      { val: 4, text: "Priority 1" },
    ];

    const priorityBtn = groupLeft.createEl("button");
    const priorityIcon = priorityBtn.createSpan("obsidian-icon");
    setIcon(priorityIcon, "flag");
    const priorityLabel = priorityBtn.createSpan();
    const currentPri =
      priorities.find((p) => p.val === this.priority)?.text || "Priority 4";
    priorityLabel.textContent = currentPri;

    priorityBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      const menu = new Menu();
      priorities.forEach((p) => {
        menu.addItem((item) => {
          item
            .setTitle(p.text)
            .setIcon("flag")
            .onClick(() => {
              this.priority = p.val;
              priorityLabel.textContent = p.text;
            });
        });
      });
      const rect = priorityBtn.getBoundingClientRect();
      menu.showAtPosition({ x: rect.left, y: rect.bottom });
    });

    const labelBtn = groupLeft.createEl("button");
    const labelIcon = labelBtn.createSpan("obsidian-icon");
    setIcon(labelIcon, "tag");
    const labelLabel = labelBtn.createSpan();
    labelLabel.textContent =
      this.labels.length > 0 ? `Labels (${this.labels.length})` : "Labels (0)";

    labelBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      this.showLabelPopover(labelBtn, labelLabel, labelsCache, TODOIST_COLORS);
    });

    // Link notes
    if (this.initialUrl) {
      const notes = root.createDiv("task-creation-notes");
      const ul = notes.createEl("ul");
      const li = ul.createEl("li");
      li.textContent =
        "A link to this page will be appended to the task description";
    }

    root.createEl("hr");

    const controls = root.createDiv("task-creation-controls");

    const projectDiv = controls.createDiv();
    const projectBtn = projectDiv.createEl("button");
    projectBtn.addClass("project-selector");
    projectBtn.setAttribute("aria-label", "Set project");

    const projectIcon = projectBtn.createSpan(
      "obsidian-icon todoist-project-icon",
    );
    setIcon(projectIcon, this.projectId ? "hash" : "inbox");

    const projectLabel = projectBtn.createSpan();
    projectLabel.textContent = "Inbox";

    const chevronIcon = projectBtn.createSpan("obsidian-icon");
    setIcon(chevronIcon, "chevron-down");

    let projectsCache: Project[] = [];
    this.service.getProjects().then((projects) => {
      projectsCache = projects.filter(
        (p) =>
          p.name !== "Inbox" &&
          !(p as unknown as { inboxProject?: boolean }).inboxProject &&
          !(p as unknown as { isInboxProject?: boolean }).isInboxProject,
      );
      const proj = projects.find((p) => p.id === this.projectId);
      if (proj) {
        projectLabel.textContent = proj.name;
        if (proj.color && TODOIST_COLORS[proj.color]) {
          projectIcon.style.color = TODOIST_COLORS[proj.color]!;
        }
      }
    });

    projectBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      this.showProjectPopover(
        projectBtn,
        projectLabel,
        projectIcon,
        projectsCache,
        TODOIST_COLORS,
      );
    });

    const actionGrp = controls.createDiv("task-creation-action");
    const cancelBtn = actionGrp.createEl("button");
    cancelBtn.textContent = "Cancel";
    cancelBtn.addEventListener("click", () => this.close());

    const addBtnGrp = actionGrp.createDiv("add-task-button-group");
    const addBtn = addBtnGrp.createEl("button");
    addBtn.addClasses(["mod-cta", "add-task-primary"]);
    addBtn.textContent = "Add task";
    addBtn.addEventListener("click", () => this.submitTask());

    const dropBtn = addBtnGrp.createEl("button");
    dropBtn.addClasses(["mod-cta", "add-task-dropdown"]);
    const dropBtnIcon = dropBtn.createSpan("obsidian-icon");
    setIcon(dropBtnIcon, "chevron-down");

    // Focus and resize initially
    setTimeout(() => {
      titleInput.focus();
      this.autoResizeTextarea(titleInput);
      this.autoResizeTextarea(descInput);
    }, 100);

    // Handle Enter to submit (only if focus is not on description textarea)
    titleInput.addEventListener("keydown", (e: KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        this.submitTask();
      }
    });
  }

  private autoResizeTextarea(textarea: HTMLTextAreaElement) {
    textarea.style.height = "auto";
    textarea.style.height = textarea.scrollHeight + "px";
  }

  private showProjectPopover(
    btn: HTMLButtonElement,
    label: HTMLSpanElement,
    iconElem: HTMLSpanElement,
    projects: Project[],
    colors: Record<string, string>,
  ) {
    if (document.body.querySelector(".task-project-menu")) {
      document.body.querySelector(".task-project-menu")?.remove();
      return;
    }
    document
      .querySelectorAll(".task-option-dialog")
      .forEach((el) => el.remove());

    const popover = btn.ownerDocument.body.createDiv(
      "task-option-dialog task-project-menu",
    );
    const rect = btn.getBoundingClientRect();
    popover.style.position = "fixed";
    popover.style.top = `${rect.bottom + 4}px`;
    popover.style.left = `${rect.left}px`;
    popover.style.zIndex = "1000";

    const searchContainer = popover.createDiv("search-filter-container");
    const searchInput = searchContainer.createEl("input", { type: "text" });
    searchInput.placeholder = "Type a project name";

    popover.createEl("hr");

    const listContainer = popover.createDiv("project-options-list");

    const renderProjects = (filter: string) => {
      listContainer.empty();

      if ("inbox".includes(filter.toLowerCase())) {
        const inboxItem = listContainer.createDiv("project-option");
        const inboxIconSpan = inboxItem.createSpan("obsidian-icon");
        setIcon(inboxIconSpan, "inbox");
        inboxItem.createSpan().textContent = "Inbox";
        inboxItem.addEventListener("click", () => {
          this.projectId = "";
          label.textContent = "Inbox";
          setIcon(iconElem, "inbox");
          iconElem.style.color = "";
          popover.remove();
        });
      }

      projects.forEach((p) => {
        if (!p.name.toLowerCase().includes(filter.toLowerCase())) return;

        const item = listContainer.createDiv("project-option");
        const iconSpan = item.createSpan("obsidian-icon");
        setIcon(iconSpan, "hash");
        if (p.color && colors[p.color]) {
          iconSpan.style.color = colors[p.color]!;
        }
        item.createSpan().textContent = p.name;

        item.addEventListener("click", () => {
          this.projectId = p.id;
          label.textContent = p.name;
          setIcon(iconElem, "hash");
          if (p.color && colors[p.color]) {
            iconElem.style.color = colors[p.color]!;
          } else {
            iconElem.style.color = "";
          }
          popover.remove();
        });
      });
    };

    renderProjects("");

    searchInput.addEventListener("input", (e) => {
      renderProjects((e.target as HTMLInputElement).value);
    });

    const closePopover = (e: MouseEvent) => {
      if (!popover.contains(e.target as Node)) {
        popover.remove();
        btn.ownerDocument.removeEventListener("click", closePopover);
      }
    };

    setTimeout(() => {
      btn.ownerDocument.addEventListener("click", closePopover);
      searchInput.focus();
    }, 0);
  }

  private showLabelPopover(
    btn: HTMLButtonElement,
    labelText: HTMLSpanElement,
    labels: Label[],
    colors: Record<string, string>,
  ) {
    if (document.body.querySelector(".task-label-menu")) {
      document.body.querySelector(".task-label-menu")?.remove();
      return;
    }
    document
      .querySelectorAll(".task-option-dialog")
      .forEach((el) => el.remove());

    const popover = btn.ownerDocument.body.createDiv(
      "task-option-dialog task-label-menu task-project-menu",
    );
    const rect = btn.getBoundingClientRect();
    popover.style.position = "fixed";
    popover.style.top = `${rect.bottom + 4}px`;
    popover.style.left = `${rect.left}px`;
    popover.style.zIndex = "1000";

    const searchContainer = popover.createDiv("search-filter-container");
    const searchInput = searchContainer.createEl("input", { type: "text" });
    searchInput.placeholder = "Type a label name";

    popover.createEl("hr");

    const listContainer = popover.createDiv("project-options-list");

    const renderLabels = (filter: string) => {
      listContainer.empty();

      labels.forEach((l) => {
        if (!l.name.toLowerCase().includes(filter.toLowerCase())) return;

        const item = listContainer.createDiv("project-option");

        const iconSpan = item.createSpan("obsidian-icon");
        setIcon(iconSpan, "tag");
        if (l.color && colors[l.color]) {
          iconSpan.style.color = colors[l.color]!;
        }

        const labelName = item.createSpan();
        labelName.textContent = l.name;

        if (this.labels.includes(l.name)) {
          item.style.backgroundColor =
            "var(--background-modifier-active-hover)";
        }

        item.addEventListener("click", (e) => {
          e.stopPropagation();
          if (this.labels.includes(l.name)) {
            this.labels = this.labels.filter((name) => name !== l.name);
          } else {
            this.labels.push(l.name);
          }
          labelText.textContent =
            this.labels.length > 0
              ? `Labels (${this.labels.length})`
              : "Labels (0)";
          renderLabels(searchInput.value);
        });
      });
    };

    renderLabels("");

    searchInput.addEventListener("input", (e) => {
      renderLabels((e.target as HTMLInputElement).value);
    });

    const closePopover = (e: MouseEvent) => {
      if (!popover.contains(e.target as Node)) {
        popover.remove();
        btn.ownerDocument.removeEventListener("click", closePopover);
      }
    };

    setTimeout(() => {
      btn.ownerDocument.addEventListener("click", closePopover);
      searchInput.focus();
    }, 0);
  }

  private showDatePopover(container: HTMLElement, btn: HTMLButtonElement) {
    if (container.querySelector(".task-date-menu")) {
      container.querySelector(".task-date-menu")?.remove();
      return;
    }
    document
      .querySelectorAll(".task-option-dialog")
      .forEach((el) => el.remove());

    const popover = btn.ownerDocument.body.createDiv(
      "task-option-dialog task-date-menu",
    );
    const rect = btn.getBoundingClientRect();
    popover.style.position = "fixed";
    popover.style.top = `${rect.bottom + 4}px`;
    popover.style.left = `${rect.left}px`;
    popover.style.zIndex = "1000";

    const addSuggestion = (
      iconId: string,
      text: string,
      dayText: string,
      val: string,
    ) => {
      const item = popover.createDiv("date-suggestion-elem");
      const label = item.createDiv("date-suggestion-label");
      const iconSpan = label.createSpan("obsidian-icon");
      setIcon(iconSpan, iconId);
      label.createSpan().textContent = text;
      item.createDiv("date-suggestion-day").textContent = dayText;
      item.addEventListener("click", () => {
        this.dueDate = val;
        btn.querySelector(".date-label")!.textContent = text;
        popover.remove();
      });
    };

    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    addSuggestion("calendar", "Today", dayNames[today.getDay()]!, "today");
    addSuggestion("sun", "Tomorrow", dayNames[tomorrow.getDay()]!, "tomorrow");
    addSuggestion(
      "calendar-clock",
      "Next week",
      dayNames[nextWeek.getDay()]!,
      "next week",
    );
    addSuggestion("ban", "No date", "", "");

    popover.createEl("hr");

    const datePicker = popover.createDiv("date-picker");
    const header = datePicker.createEl("header");
    const monthLabel = header.createEl("h4");
    const monthNames = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];
    const currentDisplayMonth = new Date();

    const controls = header.createDiv("date-picker-controls");
    const prevBtn = controls.createEl("button");
    prevBtn.textContent = "◀";
    const nextBtn = controls.createEl("button");
    nextBtn.textContent = "▶";

    const grid = datePicker.createDiv("calendar-grid");

    const renderCalendar = (monthDate: Date) => {
      grid.empty();
      monthLabel.textContent = `${monthNames[monthDate.getMonth()]} ${monthDate.getFullYear()}`;

      ["S", "M", "T", "W", "T", "F", "S"].forEach((d) => {
        const dayHeader = grid.createDiv("calendar-day-header");
        dayHeader.textContent = d;
      });

      const firstDay = new Date(
        monthDate.getFullYear(),
        monthDate.getMonth(),
        1,
      );
      const lastDay = new Date(
        monthDate.getFullYear(),
        monthDate.getMonth() + 1,
        0,
      );
      const startPad = firstDay.getDay();
      const totalDays = lastDay.getDate();

      for (let i = 0; i < startPad; i++) {
        const cell = grid.createDiv("calendar-cell");
        cell.setAttribute("data-outside-month", "true");
      }

      for (let i = 1; i <= totalDays; i++) {
        const cell = grid.createDiv("calendar-cell");
        cell.textContent = i.toString();

        cell.addEventListener("click", () => {
          const selDate = new Date(
            monthDate.getFullYear(),
            monthDate.getMonth(),
            i,
          );
          this.dueDate = `${selDate.getFullYear()}-${String(selDate.getMonth() + 1).padStart(2, "0")}-${String(selDate.getDate()).padStart(2, "0")}`;
          btn.querySelector(".date-label")!.textContent = this.dueDate;
          popover.remove();
        });
      }
    };

    renderCalendar(currentDisplayMonth);

    prevBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      currentDisplayMonth.setMonth(currentDisplayMonth.getMonth() - 1);
      renderCalendar(currentDisplayMonth);
    });

    nextBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      currentDisplayMonth.setMonth(currentDisplayMonth.getMonth() + 1);
      renderCalendar(currentDisplayMonth);
    });

    popover.createEl("hr");
    const timeContainer = popover.createDiv("time-picker-container");
    const timeBtn = timeContainer.createEl("button");
    timeBtn.addClass("time-picker-button");
    const timeIconSpan = timeBtn.createSpan("obsidian-icon");
    setIcon(timeIconSpan, "clock");
    timeBtn.createSpan().textContent = "Time";
    timeBtn.addEventListener("click", (e) => {
      e.stopPropagation();
    });

    const closePopover = (e: MouseEvent) => {
      if (!popover.contains(e.target as Node)) {
        popover.remove();
        btn.ownerDocument.removeEventListener("click", closePopover);
      }
    };

    setTimeout(() => {
      btn.ownerDocument.addEventListener("click", closePopover);
    }, 0);
  }

  private async submitTask() {
    if (!this.taskTitle.trim()) {
      new Notice("Task title cannot be empty");
      return;
    }

    let finalDesc = this.taskDesc;
    if (this.initialUrl) {
      const linkMd = `\n\n[Open in Obsidian](${this.initialUrl})`;
      finalDesc += linkMd;
    }

    const args: AddTaskArgs = {
      content: this.taskTitle,
      description: finalDesc,
      priority: this.priority,
      dueString: this.dueDate || undefined,
    };

    if (this.projectId) {
      args.projectId = this.projectId;
    }

    if (this.labels && this.labels.length > 0) {
      args.labels = this.labels;
    }

    try {
      new Notice("Adding task...");
      await this.service.addTask(args);
      new Notice(`Successfully added: "${this.taskTitle}"`);
      this.close();
    } catch (_error) {
      new Notice("Failed to add task. Check your connection and token.");
    }
  }

  onClose() {
    const { contentEl } = this;
    contentEl.empty();
  }
}
