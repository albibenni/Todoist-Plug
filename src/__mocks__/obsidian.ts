export class Plugin {
  app: any;
  constructor(app: any, manifest: any) {
    this.app = app;
  }
  addSettingTab() {}
  addCommand() {}
  registerMarkdownCodeBlockProcessor() {}
  loadData() {
    return Promise.resolve({});
  }
  saveData() {
    return Promise.resolve();
  }
}

export class Notice {}

export class PluginSettingTab {
  constructor(app: any, plugin: any) {}
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
  contentEl: any;
  constructor(app: any) {
    this.contentEl = document.createElement("div");
  }
  open() {}
  close() {}
}

export const requestUrl = async (params: any) => {
  return {
    status: 200,
    headers: {},
    json: {},
    text: "",
    arrayBuffer: new ArrayBuffer(0),
  };
};
