import { describe, it, expect, vi, afterEach } from "vitest";
import { realJiraAdapter } from "./realJiraAdapter";
import type { JiraWorklog } from "../../types/shared";

const worklog = {
  ticketId: "ABC-1",
  body: { timeSpentSeconds: 3600 },
} as unknown as JiraWorklog;

function mockFetch(body: unknown, status = 200): ReturnType<typeof vi.fn> {
  const fn = vi.fn(
    async () =>
      new Response(body === undefined ? "" : JSON.stringify(body), {
        status,
        headers: { "content-type": "application/json" },
      }),
  );
  vi.stubGlobal("fetch", fn);
  return fn;
}

afterEach(() => vi.unstubAllGlobals());

describe("realJiraAdapter.submit", () => {
  it("POSTs the worklog to /api/jira/worklog with credentials and returns the success result", async () => {
    const fetchMock = mockFetch({ ok: true, ticketId: "ABC-1", worklogId: "wl-1" });

    const result = await realJiraAdapter.submit(worklog);

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/jira/worklog");
    expect(init.method).toBe("POST");
    expect(init.credentials).toBe("include");
    expect(JSON.parse(init.body as string)).toEqual({
      ticketId: "ABC-1",
      body: { timeSpentSeconds: 3600 },
    });
    expect(result).toEqual({ ok: true, ticketId: "ABC-1", worklogId: "wl-1" });
  });

  it("passes through a 200 ticket-level failure body", async () => {
    mockFetch({
      ok: false,
      ticketId: "ABC-1",
      kind: "not-found",
      message: "no such issue",
      retryable: false,
    });
    const result = await realJiraAdapter.submit(worklog);
    expect(result).toMatchObject({ ok: false, kind: "not-found" });
  });

  it("maps a 401 to an auth failure (reconnect needed)", async () => {
    mockFetch({ error: "reconnect" }, 401);
    const result = await realJiraAdapter.submit(worklog);
    expect(result).toMatchObject({
      ok: false,
      ticketId: "ABC-1",
      kind: "auth",
      retryable: false,
    });
  });

  it("maps a 5xx to a retryable server failure", async () => {
    mockFetch({ error: "boom" }, 503);
    const result = await realJiraAdapter.submit(worklog);
    expect(result).toMatchObject({ ok: false, kind: "server", retryable: true });
  });

  it("maps a fetch/network throw to a retryable network failure", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new TypeError("Failed to fetch");
      }),
    );
    const result = await realJiraAdapter.submit(worklog);
    expect(result).toMatchObject({ ok: false, kind: "network", retryable: true });
  });

  it("re-throws when the submission was aborted", async () => {
    const controller = new AbortController();
    controller.abort();
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new DOMException("aborted", "AbortError");
      }),
    );
    await expect(
      realJiraAdapter.submit(worklog, controller.signal),
    ).rejects.toThrow();
  });
});
