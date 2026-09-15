import type {
  App,
  ButtonComponent,
  Setting,
  SettingDefinition,
  SettingDefinitionGroup,
  SettingDefinitionItem,
  SettingGroup,
} from "obsidian";
import { describe, expect, it, vi } from "vitest";
import type TodoistPlugin from "./main";
import { TodoistSettingTab } from "./settings";
import { DEFAULT_SETTINGS } from "./types";

function isDefinitionGroup(
  item: SettingDefinitionItem,
): item is SettingDefinitionGroup {
  return "type" in item && (item.type === "group" || item.type === "list");
}

function definitionNames(items: SettingDefinitionItem[]): string[] {
  return items.flatMap((item) => {
    if (isDefinitionGroup(item)) {
      return [
        ...(item.heading ? [item.heading] : []),
        ...definitionNames(item.items ?? []),
      ];
    }
    return [item.name];
  });
}

function findDefinition(
  items: SettingDefinitionItem[],
  name: string,
): SettingDefinition | undefined {
  for (const item of items) {
    if (isDefinitionGroup(item)) {
      const match = findDefinition(item.items ?? [], name);
      if (match) return match;
    } else if (!("type" in item) && item.name === name) {
      return item;
    }
  }
  return undefined;
}

function renderDefinition(
  definition: SettingDefinition | undefined,
  setting: Setting,
) {
  if (!definition) throw new Error("Setting definition was not found");
  if (!("render" in definition) || !definition.render) {
    throw new Error(`${definition.name} is not renderable`);
  }
  definition.render(setting, {} as SettingGroup);
}

describe("TodoistSettingTab", () => {
  it("publishes every setting through Obsidian's searchable definitions", () => {
    const plugin = {
      settings: { ...DEFAULT_SETTINGS },
      saveSettings: vi.fn(),
      initTodoistClient: vi.fn(),
      startOAuthConnection: vi.fn(),
      disconnectTodoist: vi.fn(),
      todoistService: null,
    } as unknown as TodoistPlugin;
    const tab = new TodoistSettingTab({} as App, plugin);

    expect(definitionNames(tab.getSettingDefinitions())).toEqual([
      "Todoist account",
      "API token",
      "Defaults",
      "Links",
      "Default Project",
      "Default Priority",
      "Default Date",
      "Default Labels",
    ]);
  });

  it("keeps the account actions and marks disconnect as destructive", () => {
    const plugin = {
      settings: {
        ...DEFAULT_SETTINGS,
        oauthAccessTokenSecret: "todoist-access-token",
      },
      startOAuthConnection: vi.fn(),
      disconnectTodoist: vi.fn(),
    } as unknown as TodoistPlugin;
    const tab = new TodoistSettingTab({} as App, plugin);
    const buttons: Array<{
      text: string;
      destructive: boolean;
      click: () => void;
    }> = [];
    const setting = {
      addButton(callback: (button: ButtonComponent) => unknown) {
        const state: (typeof buttons)[number] = {
          text: "",
          destructive: false,
          click: () => void 0,
        };
        const button = {
          buttonEl: document.createElement("button"),
          setButtonText(text: string) {
            state.text = text;
            return button;
          },
          setCta() {
            return button;
          },
          setDestructive() {
            state.destructive = true;
            return button;
          },
          onClick(click: () => void) {
            state.click = click;
            return button;
          },
        };
        callback(button as unknown as ButtonComponent);
        buttons.push(state);
        return setting;
      },
    } as unknown as Setting;

    renderDefinition(
      findDefinition(tab.getSettingDefinitions(), "Todoist account"),
      setting,
    );

    expect(buttons.map(({ text }) => text)).toEqual([
      "Reconnect",
      "Disconnect",
    ]);
    expect(buttons[1]?.destructive).toBe(true);
    buttons[0]?.click();
    buttons[1]?.click();
    expect(plugin.startOAuthConnection).toHaveBeenCalledOnce();
    expect(plugin.disconnectTodoist).toHaveBeenCalledOnce();
  });
});
