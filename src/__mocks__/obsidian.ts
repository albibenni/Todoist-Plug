export class Plugin {
  app: unknown;
  constructor(app: unknown, manifest: unknown) {
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
}

export class Notice {}

export class PluginSettingTab {
  constructor(app: unknown, plugin: unknown) {
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
}

export class App {}
export class Modal {
  contentEl: HTMLElement;
  constructor(app: unknown) {
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
  constructor(leaf: unknown) {
    this.containerEl = document.createElement("div");
    this.contentEl = document.createElement("div");
  }
}

export const setIcon = (el: HTMLElement, iconId: string) => {
  /* mock */
};

export const requestUrl = (params: unknown) => {
  return Promise.resolve({
    status: 200,
    headers: {},
    json: {},
    text: "",
    arrayBuffer: new ArrayBuffer(0),
  });
};
