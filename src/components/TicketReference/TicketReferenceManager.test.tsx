import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { UseTicketReferencesResult } from "../../hooks/useTicketReferences";
import { TicketReferenceManager } from "./TicketReferenceManager";

function makeReferences(
  overrides: Partial<UseTicketReferencesResult> = {}
): UseTicketReferencesResult {
  return {
    tickets: [],
    visibleTickets: [],
    draft: [],
    draftErrors: {},
    mode: "manage",
    search: "",
    message: null,
    warning: null,
    importText: "",
    importPreview: null,
    setSearch: vi.fn(),
    copyTicketId: vi.fn(async () => true),
    startManaging: vi.fn(),
    cancelManaging: vi.fn(),
    addDraftTicket: vi.fn(),
    updateDraftTicket: vi.fn(),
    deleteDraftTicket: vi.fn(),
    moveDraftTicket: vi.fn(),
    saveDraft: vi.fn(() => true),
    startImport: vi.fn(),
    cancelImport: vi.fn(),
    setImportText: vi.fn(),
    previewImport: vi.fn(),
    applyImport: vi.fn(),
    ...overrides,
  };
}

describe("TicketReferenceManager", () => {
  it("renders controlled draft fields and wires edits", () => {
    const references = makeReferences({
      draft: [
        {
          draftId: "draft-1",
          ticketId: "DEMO-1",
          label: "Planning",
        },
      ],
    });
    render(<TicketReferenceManager references={references} />);

    fireEvent.change(screen.getByLabelText("Ticket ID for ticket 1"), {
      target: { value: "DEMO-2" },
    });
    expect(references.updateDraftTicket).toHaveBeenCalledWith("draft-1", {
      ticketId: "DEMO-2",
      label: "Planning",
    });

    fireEvent.change(screen.getByLabelText("Label for ticket 1"), {
      target: { value: "Updated planning" },
    });
    expect(references.updateDraftTicket).toHaveBeenCalledWith("draft-1", {
      ticketId: "DEMO-1",
      label: "Updated planning",
    });
  });

  it("focuses a newly added blank ticket ID", () => {
    const references = makeReferences({
      draft: [
        {
          draftId: "draft-new",
          ticketId: "",
          label: "",
        },
      ],
    });
    render(<TicketReferenceManager references={references} />);

    expect(screen.getByLabelText("Ticket ID for ticket 1")).toHaveFocus();
  });

  it("connects inline errors to their fields", () => {
    const references = makeReferences({
      draft: [
        {
          draftId: "draft-1",
          ticketId: "bad id",
          label: "",
        },
      ],
      draftErrors: {
        "draft-1": {
          ticketId: "Use a ticket ID like DEMO-42.",
          label: "Add a short label.",
        },
      },
    });
    render(<TicketReferenceManager references={references} />);

    expect(screen.getByLabelText("Ticket ID for ticket 1")).toHaveAccessibleDescription(
      "Use a ticket ID like DEMO-42."
    );
    expect(screen.getByLabelText("Label for ticket 1")).toHaveAccessibleDescription(
      "Add a short label."
    );
  });

  it("wires add, import, cancel, save, and delete actions", () => {
    const references = makeReferences({
      draft: [
        {
          draftId: "draft-1",
          ticketId: "DEMO-1",
          label: "Planning",
        },
      ],
    });
    render(<TicketReferenceManager references={references} />);

    fireEvent.click(screen.getByRole("button", { name: "Add ticket" }));
    expect(references.addDraftTicket).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole("button", { name: "Import list" }));
    expect(references.startImport).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole("button", { name: "Delete DEMO-1" }));
    expect(references.deleteDraftTicket).toHaveBeenCalledWith("draft-1");

    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(references.cancelManaging).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
    expect(references.saveDraft).toHaveBeenCalledTimes(1);
  });

  it("provides visible move controls and a keyboard drag handle", () => {
    const references = makeReferences({
      draft: [
        {
          draftId: "draft-1",
          ticketId: "DEMO-1",
          label: "First",
        },
        {
          draftId: "draft-2",
          ticketId: "DEMO-2",
          label: "Second",
        },
      ],
    });
    render(<TicketReferenceManager references={references} />);

    expect(screen.getByRole("button", { name: "Drag DEMO-1 to reorder" }))
      .toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Move DEMO-1 up" }))
      .toBeDisabled();
    expect(screen.getByRole("button", { name: "Move DEMO-2 down" }))
      .toBeDisabled();

    fireEvent.click(screen.getByRole("button", { name: "Move DEMO-1 down" }));
    expect(references.moveDraftTicket).toHaveBeenCalledWith(0, 1);

    fireEvent.click(screen.getByRole("button", { name: "Move DEMO-2 up" }));
    expect(references.moveDraftTicket).toHaveBeenCalledWith(1, 0);
  });
});
