import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { UseTicketReferencesResult } from "../../hooks/useTicketReferences";
import { TicketReferencePanel } from "./TicketReferencePanel";

function makeReferences(
  overrides: Partial<UseTicketReferencesResult> = {}
): UseTicketReferencesResult {
  return {
    tickets: [],
    visibleTickets: [],
    draft: [],
    draftErrors: {},
    mode: "reference",
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

describe("TicketReferencePanel", () => {
  it("guides an empty list into add or import flows", () => {
    const references = makeReferences();
    render(<TicketReferencePanel references={references} />);

    expect(screen.getByText("No common tickets yet")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Add ticket" }));
    expect(references.startManaging).toHaveBeenCalledTimes(1);
    expect(references.addDraftTicket).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole("button", { name: "Import list" }));
    expect(references.startManaging).toHaveBeenCalledTimes(2);
    expect(references.startImport).toHaveBeenCalledTimes(1);
  });

  it("renders copyable tickets, search, count, and management action", () => {
    const tickets = [
      { ticketId: "DEMO-1", label: "Daily planning" },
      { ticketId: "TEAM-2", label: "Project meeting" },
    ];
    const references = makeReferences({
      tickets,
      visibleTickets: tickets,
    });
    render(<TicketReferencePanel references={references} />);

    fireEvent.change(screen.getByRole("searchbox", { name: "Search tickets" }), {
      target: { value: "daily" },
    });
    expect(references.setSearch).toHaveBeenCalledWith("daily");

    fireEvent.click(screen.getByRole("button", {
      name: "Copy DEMO-1 — Daily planning",
    }));
    expect(references.copyTicketId).toHaveBeenCalledWith("DEMO-1");

    expect(screen.getByText("2 tickets")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Manage list" }));
    expect(references.startManaging).toHaveBeenCalledTimes(1);
  });

  it("announces copy and persistence messages", () => {
    const references = makeReferences({
      message: "Copied DEMO-1",
      warning: "Tickets could not be saved in this browser.",
    });
    render(<TicketReferencePanel references={references} />);

    expect(screen.getByRole("status")).toHaveTextContent("Copied DEMO-1");
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Tickets could not be saved in this browser."
    );
  });
});
