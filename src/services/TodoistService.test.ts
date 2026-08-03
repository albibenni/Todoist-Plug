import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TodoistApi } from "../api";
import { TodoistService } from "./TodoistService";

describe("TodoistService", () => {
  let mockApi: {
    quickAddTask: ReturnType<typeof vi.fn>;
    getTasks: ReturnType<typeof vi.fn>;
    getTasksByFilter: ReturnType<typeof vi.fn>;
  };
  let service: TodoistService;

  beforeEach(() => {
    mockApi = {
      quickAddTask: vi.fn(),
      getTasks: vi.fn(),
      getTasksByFilter: vi.fn(),
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

  describe("checkTaskExists", () => {
    it("should return true if a task matches the sanitized text", async () => {
      mockApi.getTasksByFilter.mockResolvedValue([
        { id: "1", content: "Buy milk" },
      ]);

      // Should sanitize '#Groceries @shop p1 today' out of the string
      const result = await service.checkTaskExists(
        "Buy milk #Groceries @shop p1 today",
      );

      expect(mockApi.getTasksByFilter).toHaveBeenCalledWith({
        query: "search: buy milk",
      });
      expect(result).toBe(true);
    });

    it("should return false if no tasks match the text", async () => {
      mockApi.getTasksByFilter.mockResolvedValue([
        { id: "1", content: "Do laundry" },
      ]);

      const result = await service.checkTaskExists("Buy milk");
      expect(result).toBe(false);
    });

    it("should fallback to checking filename if text doesn't match", async () => {
      // First call (content search) returns empty
      // Second call (filename search) returns match
      mockApi.getTasksByFilter
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([{ id: "1", content: "Read Notes.md" }]);

      const result = await service.checkTaskExists(
        "Read about topics",
        "Notes.md",
      );

      expect(mockApi.getTasksByFilter).toHaveBeenCalledTimes(2);
      expect(mockApi.getTasksByFilter).toHaveBeenNthCalledWith(1, {
        query: "search: read about topics",
      });
      expect(mockApi.getTasksByFilter).toHaveBeenNthCalledWith(2, {
        query: "search: Notes.md",
      });
      expect(result).toBe(true);
    });

    it("should handle API errors gracefully and return false", async () => {
      mockApi.getTasksByFilter.mockRejectedValue(new Error("API Error"));

      const result = await service.checkTaskExists("Buy milk");
      expect(result).toBe(false);
    });
  });
});
