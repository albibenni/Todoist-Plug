// biome-ignore lint/suspicious/noExplicitAny: mock
(globalThis as any).createEl = (tag: string) => document.createElement(tag);

import { beforeEach, describe, expect, it, vi } from "vitest";
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
  let plugin: TodoistPlugin;

  beforeEach(() => {
    appMock = {
      secretStorage: {
        getSecret: vi.fn(),
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
      // @ts-ignore
      appMock.secretStorage.getSecret.mockReturnValue("test-token");
      plugin.settings.apiToken = "my-secret-name";

      const token = plugin.getApiToken();

      expect(appMock.secretStorage.getSecret).toHaveBeenCalledWith(
        "my-secret-name",
      );
      expect(token).toBe("test-token");
    });
  });

  describe("initTodoistClient", () => {
    it("should initialize clients if token exists", () => {
      // @ts-ignore
      appMock.secretStorage.getSecret.mockReturnValue("test-token");

      plugin.initTodoistClient();

      expect(plugin.api).not.toBeNull();
      expect(plugin.todoistService).not.toBeNull();
    });

    it("should set clients to null if no token exists", () => {
      // @ts-ignore
      appMock.secretStorage.getSecret.mockReturnValue(null);

      // Pre-fill with fake data to verify it gets wiped
      plugin.api = {} as TodoistApi;
      plugin.todoistService = {} as TodoistService;

      plugin.initTodoistClient();

      expect(plugin.api).toBeNull();
      expect(plugin.todoistService).toBeNull();
    });
  });
});
