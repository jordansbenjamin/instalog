import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  loadTicketReferences,
  saveTicketReferences,
} from "./ticketReferencePersistence";

const STORAGE_KEY = "instalog:ticket-references:v1";

describe("ticketReferencePersistence", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("loads an empty list when no record exists", () => {
    expect(loadTicketReferences()).toEqual({
      tickets: [],
      warning: null,
    });
  });

  it("loads and normalises a valid versioned record", () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        version: 1,
        tickets: [
          { ticketId: " demo-1 ", label: " Planning " },
          { ticketId: "TEAM-2", label: "Team meeting" },
        ],
      })
    );

    expect(loadTicketReferences()).toEqual({
      tickets: [
        { ticketId: "DEMO-1", label: "Planning" },
        { ticketId: "TEAM-2", label: "Team meeting" },
      ],
      warning: null,
    });
  });

  it.each([
    "{broken json",
    JSON.stringify({ version: 2, tickets: [] }),
    JSON.stringify({ version: 1, tickets: "not-an-array" }),
  ])("recovers from malformed or unsupported records", (record) => {
    localStorage.setItem(STORAGE_KEY, record);

    expect(loadTicketReferences()).toEqual({
      tickets: [],
      warning: "Saved tickets could not be read. Start with an empty list.",
    });
  });

  it("excludes invalid items and keeps the first valid duplicate", () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        version: 1,
        tickets: [
          { ticketId: "DEMO-1", label: "First label" },
          { ticketId: "bad id", label: "Broken" },
          { ticketId: "DEMO-1", label: "Second label" },
          { ticketId: "TEAM-2", label: "" },
        ],
      })
    );

    expect(loadTicketReferences()).toEqual({
      tickets: [{ ticketId: "DEMO-1", label: "First label" }],
      warning: "Some saved tickets could not be loaded.",
    });
  });

  it("surfaces storage read failures", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("blocked");
    });

    expect(loadTicketReferences()).toEqual({
      tickets: [],
      warning: "Tickets could not be loaded from this browser.",
    });
  });

  it("saves a validated versioned record", () => {
    expect(
      saveTicketReferences([
        { ticketId: " demo-1 ", label: " Planning " },
      ])
    ).toBeNull();

    expect(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "")).toEqual({
      version: 1,
      tickets: [{ ticketId: "DEMO-1", label: "Planning" }],
    });
  });

  it("refuses to save invalid records", () => {
    expect(
      saveTicketReferences([{ ticketId: "bad id", label: "Broken" }])
    ).toBe("Tickets could not be saved because the list is invalid.");
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it("surfaces storage write failures", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("quota exceeded");
    });

    expect(
      saveTicketReferences([{ ticketId: "DEMO-1", label: "Planning" }])
    ).toBe("Tickets could not be saved in this browser.");
  });
});
