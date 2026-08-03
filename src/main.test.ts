// biome-ignore lint/suspicious/noExplicitAny: mock
(global as any).createEl = (tag: string) => document.createElement(tag);

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

import type { TodoistApi } from "@doist/todoist-sdk";
import type { App, PluginManifest } from "obsidian";
import type { TodoistService } from "./services/TodoistService";

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
  });

  describe("getApiToken / setApiToken", () => {
    it("should securely retrieve the token from app.secretStorage", () => {
      // @ts-ignore
      appMock.secretStorage.getSecret.mockReturnValue("test-token");

      const token = plugin.getApiToken();

      expect(appMock.secretStorage.getSecret).toHaveBeenCalledWith(
        "todoist-api-token",
      );
      expect(token).toBe("test-token");
    });

    it("should securely save the token to app.secretStorage", () => {
      plugin.setApiToken("new-token-123");

      expect(appMock.secretStorage.setSecret).toHaveBeenCalledWith(
        "todoist-api-token",
        "new-token-123",
      );
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
