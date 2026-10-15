export class Plugin {
  app: unknown;
  constructor(app: unknown, _manifest: unknown) {
    this.app = app;
  }
  addSettingTab() {
    /* mock */
  }
  addCommand() {
    /* mock */
  }
  registerMarkdownCodeBlockProcessor() {
    /* mock */
  }
  loadData() {
    return Promise.resolve({});
  }
  saveData() {
    return Promise.resolve();
  }
  registerView() {
    /* mock */
  }
  registerObsidianProtocolHandler() {
    /* mock */
  }
}

export class Notice {}

export class PluginSettingTab {
  constructor(_app: unknown, _plugin: unknown) {
    /* mock */
  }
}

export class Setting {
  setName() {
    return this;
  }
  setDesc() {
    return this;
  }
  addText() {
    return this;
  }
  addButton() {
    return this;
  }
  setHeading() {
    return this;
  }
}

export class App {}
export class Modal {
  contentEl: HTMLElement;
  constructor(_app: unknown) {
    this.contentEl = document.createElement("div");
  }
  open() {
    /* mock */
  }
  close() {
    /* mock */
  }
}

export class ItemView {
  containerEl: HTMLElement;
  contentEl: HTMLElement;
  constructor(_leaf: unknown) {
    this.containerEl = document.createElement("div");
    this.contentEl = document.createElement("div");
  }
}

export const setIcon = (_el: HTMLElement, _iconId: string) => {
  /* mock */
};

export const requestUrl = (_params: unknown) => {
  return Promise.resolve({
    status: 200,
    headers: {},
    json: {},
    text: "",
    arrayBuffer: new ArrayBuffer(0),
  });
};
