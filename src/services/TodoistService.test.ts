import type { TodoistApi } from "@doist/todoist-sdk";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { TodoistService } from "./TodoistService";

describe("TodoistService", () => {
  let mockApi: Record<string, ReturnType<typeof vi.fn>>;
  let service: TodoistService;

  beforeEach(() => {
    mockApi = {
      quickAddTask: vi.fn(),
      getTasks: vi.fn(),
    };
    service = new TodoistService(mockApi as unknown as TodoistApi);
  });

  describe("addQuickTask", () => {
    it("should call api.quickAddTask with the provided text", async () => {
      const mockTask = { id: "123", content: "Buy milk" };
      mockApi.quickAddTask.mockResolvedValue(mockTask);

      const result = await service.addQuickTask("Buy milk #groceries @today");

      expect(mockApi.quickAddTask).toHaveBeenCalledWith({
        text: "Buy milk #groceries @today",
      });
      expect(result).toEqual(mockTask);
    });

    it("should throw an error if text is empty", async () => {
      await expect(service.addQuickTask("   ")).rejects.toThrow(
        "Task text cannot be empty",
      );
      expect(mockApi.quickAddTask).not.toHaveBeenCalled();
    });

    it("should handle API failures gracefully", async () => {
      mockApi.quickAddTask.mockRejectedValue(new Error("Network error"));
      await expect(service.addQuickTask("Buy milk")).rejects.toThrow(
        "Failed to add task to Todoist",
      );
    });
  });

  describe("fetchTasks", () => {
    it("should fetch all tasks if no filter is provided", async () => {
      mockApi.getTasks.mockResolvedValue({ results: [] });
      await service.fetchTasks();
      expect(mockApi.getTasks).toHaveBeenCalled();
    });

    it("should fetch tasks with a filter if provided", async () => {
      mockApi.getTasksByFilter = vi.fn().mockResolvedValue({ results: [] });
      await service.fetchTasks("today");
      expect(mockApi.getTasksByFilter).toHaveBeenCalledWith({ query: "today" });
    });
  });
});
