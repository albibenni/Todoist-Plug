globalThis.createEl = <K extends keyof HTMLElementTagNameMap>(
  tag: K,
  _options?: unknown,
  callback?: (element: HTMLElementTagNameMap[K]) => void,
): HTMLElementTagNameMap[K] => {
  const element = document.createElement(tag);
  callback?.(element);
  return element;
};

import { beforeEach, describe, expect, it, vi } from "vite-plus/test";

import TodoistPlugin from "./main";

// Mock the Todoist SDK
vi.mock("@doist/todoist-sdk", () => {
  return {
    TodoistApi: class {
      getProjects = vi.fn();
    },
  };
});

import type { App, PluginManifest } from "obsidian";

import type { TodoistApi } from "./api";
import type { TodoistService } from "./services/TodoistService";
import type { TodoistPluginSettings } from "./types";

describe("TodoistPlugin Token Logic", () => {
  let appMock: App;
  let getSecret: ReturnType<typeof vi.fn>;
  let plugin: TodoistPlugin;

  beforeEach(() => {
    getSecret = vi.fn();
    appMock = {
      secretStorage: {
        getSecret,
        setSecret: vi.fn(),
      },
    } as unknown as App;
    // Instantiate the plugin with our mocked app
    plugin = new TodoistPlugin(appMock, {} as PluginManifest);
    plugin.settings = {
      apiToken: "todoist-api-token",
    } as unknown as TodoistPluginSettings;
  });

  describe("getApiToken", () => {
    it("should securely retrieve the token from app.secretStorage", () => {
      getSecret.mockReturnValue("test-token");
      plugin.settings.apiToken = "my-secret-name";

      const token = plugin.getApiToken();

      expect(getSecret).toHaveBeenCalledWith("my-secret-name");
      expect(token).toBe("test-token");
    });
  });

  describe("initTodoistClient", () => {
    it("should initialize clients if a token exists", async () => {
      getSecret.mockReturnValue("test-token");

      await plugin.initTodoistClient();

      expect(plugin.api).not.toBeNull();
      expect(plugin.todoistService).not.toBeNull();
    });

    it("should set clients to null if no token exists", async () => {
      getSecret.mockReturnValue(null);

      // Pre-fill with fake data to verify it gets wiped
      plugin.api = {} as TodoistApi;
      plugin.todoistService = {} as TodoistService;

      await plugin.initTodoistClient();

      expect(plugin.api).toBeNull();
      expect(plugin.todoistService).toBeNull();
    });
  });
});
