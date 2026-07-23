import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useTicketReferences } from "./useTicketReferences";

const STORAGE_KEY = "instalog:ticket-references:v1";
const originalClipboard = navigator.clipboard;

function seedTickets(
  tickets: Array<{ ticketId: string; label: string }>
): void {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      version: 1,
      tickets,
    })
  );
}

function setClipboard(writeText: (text: string) => Promise<void>): void {
  Object.defineProperty(navigator, "clipboard", {
    configurable: true,
    value: { writeText },
  });
}

describe("useTicketReferences", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: originalClipboard,
    });
  });

  it("loads tickets and filters by ID or label case-insensitively", () => {
    seedTickets([
      { ticketId: "DEMO-1", label: "Daily planning" },
      { ticketId: "TEAM-2", label: "Project meeting" },
    ]);
    const { result } = renderHook(() => useTicketReferences());

    expect(result.current.visibleTickets).toHaveLength(2);

    act(() => {
      result.current.setSearch("daily");
    });
    expect(result.current.visibleTickets.map((ticket) => ticket.ticketId)).toEqual([
      "DEMO-1",
    ]);

    act(() => {
      result.current.setSearch("team-2");
    });
    expect(result.current.visibleTickets.map((ticket) => ticket.ticketId)).toEqual([
      "TEAM-2",
    ]);
  });

  it("copies a ticket ID and clears the success message", async () => {
    const writeText = vi.fn(async () => undefined);
    setClipboard(writeText);
    const { result } = renderHook(() => useTicketReferences());

    await act(async () => {
      await result.current.copyTicketId("DEMO-1");
    });

    expect(writeText).toHaveBeenCalledWith("DEMO-1");
    expect(result.current.message).toBe("Copied DEMO-1");

    act(() => {
      vi.runAllTimers();
    });
    expect(result.current.message).toBeNull();
  });

  it("surfaces clipboard failures", async () => {
    setClipboard(vi.fn(async () => {
      throw new Error("blocked");
    }));
    const { result } = renderHook(() => useTicketReferences());

    await act(async () => {
      await result.current.copyTicketId("DEMO-1");
    });

    expect(result.current.message).toBe(
      "Could not copy automatically. Select the ticket ID to copy it."
    );
  });

  it("creates a reversible management draft", () => {
    seedTickets([{ ticketId: "DEMO-1", label: "Planning" }]);
    const { result } = renderHook(() => useTicketReferences());

    act(() => {
      result.current.startManaging();
    });
    const draftId = result.current.draft[0].draftId;

    act(() => {
      result.current.updateDraftTicket(draftId, {
        ticketId: "DEMO-1",
        label: "Changed planning",
      });
      result.current.addDraftTicket();
    });

    expect(result.current.draft).toHaveLength(2);
    expect(result.current.tickets[0].label).toBe("Planning");

    act(() => {
      result.current.cancelManaging();
    });

    expect(result.current.mode).toBe("reference");
    expect(result.current.tickets).toEqual([
      { ticketId: "DEMO-1", label: "Planning" },
    ]);
    expect(result.current.draft).toEqual([]);
  });

  it("normalises and persists a valid draft", () => {
    seedTickets([{ ticketId: "DEMO-1", label: "Planning" }]);
    const { result } = renderHook(() => useTicketReferences());

    act(() => {
      result.current.startManaging();
    });
    const draftId = result.current.draft[0].draftId;

    act(() => {
      result.current.updateDraftTicket(draftId, {
        ticketId: " demo-2 ",
        label: " Updated planning ",
      });
    });

    let saved = false;
    act(() => {
      saved = result.current.saveDraft();
    });

    expect(saved).toBe(true);
    expect(result.current.mode).toBe("reference");
    expect(result.current.tickets).toEqual([
      { ticketId: "DEMO-2", label: "Updated planning" },
    ]);
    expect(
      JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "").tickets
    ).toEqual([{ ticketId: "DEMO-2", label: "Updated planning" }]);
  });

  it("rejects invalid and duplicate draft tickets with row errors", () => {
    seedTickets([{ ticketId: "DEMO-1", label: "Planning" }]);
    const { result } = renderHook(() => useTicketReferences());

    act(() => {
      result.current.startManaging();
    });
    act(() => {
      result.current.addDraftTicket();
    });

    const firstDraftId = result.current.draft[0].draftId;
    const secondDraftId = result.current.draft[1].draftId;

    act(() => {
      result.current.updateDraftTicket(firstDraftId, {
        ticketId: "DEMO-1",
        label: "",
      });
      result.current.updateDraftTicket(secondDraftId, {
        ticketId: "DEMO-1",
        label: "Duplicate",
      });
    });

    let saved = true;
    act(() => {
      saved = result.current.saveDraft();
    });

    expect(saved).toBe(false);
    expect(result.current.mode).toBe("manage");
    expect(result.current.draftErrors[firstDraftId]).toEqual({
      label: "Add a short label.",
      ticketId: "Ticket IDs must be unique.",
    });
    expect(result.current.draftErrors[secondDraftId]).toEqual({
      ticketId: "Ticket IDs must be unique.",
    });
  });

  it("deletes and reorders draft rows without crossing boundaries", () => {
    seedTickets([
      { ticketId: "DEMO-1", label: "First" },
      { ticketId: "DEMO-2", label: "Second" },
      { ticketId: "DEMO-3", label: "Third" },
    ]);
    const { result } = renderHook(() => useTicketReferences());

    act(() => {
      result.current.startManaging();
    });

    act(() => {
      result.current.moveDraftTicket(0, 2);
      result.current.moveDraftTicket(2, 10);
    });

    expect(result.current.draft.map((row) => row.ticketId)).toEqual([
      "DEMO-2",
      "DEMO-3",
      "DEMO-1",
    ]);

    const middleDraftId = result.current.draft[1].draftId;
    act(() => {
      result.current.deleteDraftTicket(middleDraftId);
    });

    expect(result.current.draft.map((row) => row.ticketId)).toEqual([
      "DEMO-2",
      "DEMO-1",
    ]);
  });

  it("previews and applies imports to the draft only", () => {
    seedTickets([{ ticketId: "DEMO-1", label: "Planning" }]);
    const { result } = renderHook(() => useTicketReferences());

    act(() => {
      result.current.startManaging();
      result.current.startImport();
    });
    act(() => {
      result.current.setImportText(
        ["DEMO-1,Updated planning", "NEW-2,New work"].join("\n")
      );
    });
    act(() => {
      result.current.previewImport();
    });

    expect(result.current.importPreview?.counts).toMatchObject({
      new: 1,
      update: 1,
    });

    act(() => {
      result.current.applyImport();
    });

    expect(result.current.mode).toBe("manage");
    expect(result.current.draft.map(({ ticketId, label }) => ({
      ticketId,
      label,
    }))).toEqual([
      { ticketId: "DEMO-1", label: "Updated planning" },
      { ticketId: "NEW-2", label: "New work" },
    ]);
    expect(result.current.tickets).toEqual([
      { ticketId: "DEMO-1", label: "Planning" },
    ]);
  });

  it("keeps in-memory changes and warns when saving fails", () => {
    seedTickets([{ ticketId: "DEMO-1", label: "Planning" }]);
    const { result } = renderHook(() => useTicketReferences());
    act(() => {
      result.current.startManaging();
    });
    const draftId = result.current.draft[0].draftId;

    act(() => {
      result.current.updateDraftTicket(draftId, {
        ticketId: "DEMO-1",
        label: "Changed planning",
      });
    });

    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("quota exceeded");
    });

    act(() => {
      result.current.saveDraft();
    });

    expect(result.current.tickets[0].label).toBe("Changed planning");
    expect(result.current.warning).toBe(
      "Tickets could not be saved in this browser."
    );
  });
});
