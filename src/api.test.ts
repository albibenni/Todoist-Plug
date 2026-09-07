import { beforeEach, describe, expect, it, vi } from "vitest";

const { requestUrl } = vi.hoisted(() => ({ requestUrl: vi.fn() }));

vi.mock("obsidian", () => ({ requestUrl }));

import { TodoistApi } from "./api";

const task = {
  id: "task-1",
  project_id: "project-1",
  content: "Ship the fix",
};

describe("TodoistApi", () => {
  beforeEach(() => {
    requestUrl.mockReset();
  });

  it("uses the API v1 filter endpoint and follows pagination cursors", async () => {
    requestUrl
      .mockResolvedValueOnce({
        status: 200,
        json: { results: [task], next_cursor: "next page" },
        text: "",
      })
      .mockResolvedValueOnce({
        status: 200,
        json: {
          results: [{ ...task, id: "task-2" }],
          next_cursor: null,
        },
        text: "",
      });

    const result = await new TodoistApi(" token ").getTasksByFilter({
      query: "today | overdue",
    });

    expect(result).toHaveLength(2);
    expect(requestUrl).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        url: "https://api.todoist.com/api/v1/tasks/filter?query=today%20%7C%20overdue",
        headers: { Authorization: "Bearer token" },
      }),
    );
    expect(requestUrl).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        url: "https://api.todoist.com/api/v1/tasks/filter?query=today%20%7C%20overdue&cursor=next%20page",
      }),
    );
  });

  it("posts structured task fields to the standard task endpoint", async () => {
    requestUrl.mockResolvedValue({ status: 200, json: task, text: "" });

    await new TodoistApi("token").addTask({
      content: "Ship the fix",
      due_string: "tomorrow",
      labels: ["work"],
    });

    expect(requestUrl).toHaveBeenCalledWith(
      expect.objectContaining({
        url: "https://api.todoist.com/api/v1/tasks",
        method: "POST",
        headers: {
          Authorization: "Bearer token",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: "Ship the fix",
          due_string: "tomorrow",
          labels: ["work"],
        }),
      }),
    );
  });

  it("deletes a task through the Todoist task endpoint", async () => {
    requestUrl.mockResolvedValue({ status: 204, json: null, text: "" });

    await new TodoistApi("token").deleteTask("task-1");

    expect(requestUrl).toHaveBeenCalledWith(
      expect.objectContaining({
        url: "https://api.todoist.com/api/v1/tasks/task-1",
        method: "DELETE",
        headers: { Authorization: "Bearer token" },
      }),
    );
  });

  it("does not expose a successful-looking result for API errors", async () => {
    requestUrl.mockResolvedValue({
      status: 401,
      json: null,
      text: "Unauthorized",
    });

    await expect(new TodoistApi("token").getTasks()).rejects.toThrow(
      "Todoist API error: 401",
    );
  });

  it("refreshes an OAuth token once after an unauthorized response", async () => {
    const refreshToken = vi.fn().mockResolvedValue("fresh-token");
    requestUrl
      .mockResolvedValueOnce({ status: 401, json: null, text: "Unauthorized" })
      .mockResolvedValueOnce({
        status: 200,
        json: { results: [task], next_cursor: null },
        text: "",
      });

    const result = await new TodoistApi(
      "expired-token",
      refreshToken,
    ).getTasks();

    expect(result).toEqual([task]);
    expect(refreshToken).toHaveBeenCalledOnce();
    expect(requestUrl).toHaveBeenLastCalledWith(
      expect.objectContaining({
        headers: { Authorization: "Bearer fresh-token" },
      }),
    );
  });
});
