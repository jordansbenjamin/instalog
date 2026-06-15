import { describe, it, expect, vi, afterEach } from "vitest";
import { atlassianConnection, getCurrentAccount } from "./atlassianConnection";

afterEach(() => vi.unstubAllGlobals());

describe("atlassianConnection.connect", () => {
  it("redirects the browser to the server authorize endpoint", () => {
    const assign = vi.fn();
    const original = window.location;
    // jsdom's location.assign isn't spyable, so swap the whole location object.
    Object.defineProperty(window, "location", {
      configurable: true,
      value: { assign },
    });
    try {
      void atlassianConnection.connect();
      expect(assign).toHaveBeenCalledWith("/api/jira/authorize");
    } finally {
      Object.defineProperty(window, "location", {
        configurable: true,
        value: original,
      });
    }
  });
});

describe("atlassianConnection.disconnect", () => {
  it("POSTs to the disconnect endpoint with credentials", async () => {
    const fetchMock = vi.fn(async () => new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetchMock);

    await atlassianConnection.disconnect();

    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("/api/jira/disconnect");
    expect(init.method).toBe("POST");
    expect(init.credentials).toBe("include");
  });
});

describe("getCurrentAccount", () => {
  it("returns the account from /api/me", async () => {
    const account = {
      name: "Maddy Chen",
      site: "graphite.atlassian.net",
      initials: "MC",
      isDemo: false,
    };
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(JSON.stringify({ account }), { status: 200 })),
    );

    expect(await getCurrentAccount()).toEqual(account);
  });

  it("returns null when /api/me reports no account", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(JSON.stringify({ account: null }), { status: 200 })),
    );
    expect(await getCurrentAccount()).toBeNull();
  });

  it("returns null on a non-ok response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("nope", { status: 401 })),
    );
    expect(await getCurrentAccount()).toBeNull();
  });

  it("returns null when the request throws", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new TypeError("Failed to fetch");
      }),
    );
    expect(await getCurrentAccount()).toBeNull();
  });
});
