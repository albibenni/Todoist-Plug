import type { AddTaskArgs } from "@doist/todoist-sdk";
import { App, Modal, Notice, setIcon, Menu } from "obsidian";
import type { TodoistService } from "../services/TodoistService";
import type { TodoistPluginSettings } from "../settings";

export class QuickAddModal extends Modal {
  private taskTitle = "";
  private taskDesc = "";
  private dueDate = "";
  private priority = 1;
  private projectId = "";

  private service: TodoistService;
  private settings: TodoistPluginSettings;
  private initialTitle: string;
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
    this.settings = settings;

    this.initialTitle = initialTitle;
    this.initialUrl = initialUrl;

    this.taskTitle = initialTitle;
    this.dueDate = settings.defaultDate || "today";
    this.priority = settings.defaultPriority || 1;
    this.projectId = settings.defaultProject || "";
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.empty();

    const root = contentEl.createDiv("task-creation-modal-root");

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
    const dateLabel = this.dueDate ? this.dueDate.charAt(0).toUpperCase() + this.dueDate.slice(1) : "Today";
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
    const currentPri = priorities.find(p => p.val === this.priority)?.text || "Priority 4";
    priorityLabel.textContent = " " + currentPri;

    priorityBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      const menu = new Menu();
      priorities.forEach(p => {
        menu.addItem((item) => {
          item
            .setTitle(p.text)
            .setIcon("flag")
            .onClick(() => {
              this.priority = p.val;
              priorityLabel.textContent = " " + p.text;
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
    labelLabel.textContent = " Labels (0)";
    
    labelBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      new Notice("Labels feature coming soon!");
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
    const projectSelect = projectDiv.createEl("select");
    projectSelect.addClass("project-selector");

    const inboxOpt = projectSelect.createEl("option");
    inboxOpt.value = "";
    inboxOpt.textContent = "# Inbox";
    projectSelect.value = this.projectId;

    this.service.getProjects().then((projects) => {
      projects.forEach((p) => {
        const opt = projectSelect.createEl("option");
        opt.value = p.id;
        opt.textContent = "# " + p.name;
      });
      projectSelect.value = this.projectId;
    });

    projectSelect.addEventListener("change", (e) => {
      this.projectId = (e.target as HTMLSelectElement).value;
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

  private showDatePopover(container: HTMLElement, btn: HTMLButtonElement) {
    if (container.querySelector(".task-date-menu")) {
      container.querySelector(".task-date-menu")?.remove();
      return;
    }
    document.querySelectorAll(".task-option-dialog").forEach((el) => el.remove());

    const popover = btn.ownerDocument.body.createDiv("task-option-dialog task-date-menu");
    const rect = btn.getBoundingClientRect();
    popover.style.position = "fixed";
    popover.style.top = `${rect.bottom + 4}px`;
    popover.style.left = `${rect.left}px`;
    popover.style.zIndex = "1000";

    const addSuggestion = (iconId: string, text: string, dayText: string, val: string) => {
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
    addSuggestion("calendar-clock", "Next week", dayNames[nextWeek.getDay()]!, "next week");
    addSuggestion("ban", "No date", "", "");

    popover.createEl("hr");

    const datePicker = popover.createDiv("date-picker");
    const header = datePicker.createEl("header");
    const monthLabel = header.createEl("h4");
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    let currentDisplayMonth = new Date();
    
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
      
      const firstDay = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
      const lastDay = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);
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
          const selDate = new Date(monthDate.getFullYear(), monthDate.getMonth(), i);
          this.dueDate = `${selDate.getFullYear()}-${String(selDate.getMonth()+1).padStart(2, "0")}-${String(selDate.getDate()).padStart(2, "0")}`;
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

    try {
      new Notice("Adding task...");
      await this.service.addTask(args);
      new Notice(`Successfully added: "${this.taskTitle}"`);
      this.close();
    } catch (error) {
      new Notice("Failed to add task. Check your connection and token.");
    }
  }

  onClose() {
    const { contentEl } = this;
    contentEl.empty();
  }
}
