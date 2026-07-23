import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type {
  TicketImportPreview,
  TicketImportPreviewRow,
} from "../../domain/ticketReference";
import type { UseTicketReferencesResult } from "../../hooks/useTicketReferences";
import { TicketImport } from "./TicketImport";

function makePreview(
  rows: TicketImportPreviewRow[],
  counts: TicketImportPreview["counts"]
): TicketImportPreview {
  return { rows, counts };
}

function makeReferences(
  overrides: Partial<UseTicketReferencesResult> = {}
): UseTicketReferencesResult {
  return {
    tickets: [],
    visibleTickets: [],
    draft: [],
    draftErrors: {},
    mode: "import",
    search: "",
    message: null,
    warning: null,
    importText: "",
    importPreview: null,
    setSearch: vi.fn(),
    copyTicketId: vi.fn(async () => undefined),
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

describe("TicketImport", () => {
  it("captures pasted text and guards an empty preview", () => {
    const references = makeReferences();
    render(<TicketImport references={references} />);

    expect(screen.getByRole("button", { name: "Preview import" }))
      .toBeDisabled();

    fireEvent.change(screen.getByLabelText("Ticket list"), {
      target: { value: "DEMO-1,Planning" },
    });
    expect(references.setImportText).toHaveBeenCalledWith("DEMO-1,Planning");

    fireEvent.click(screen.getByRole("button", { name: "Cancel import" }));
    expect(references.cancelImport).toHaveBeenCalledTimes(1);
  });

  it("shows preview statuses, row messages, and exact confirmation copy", () => {
    const references = makeReferences({
      importText: "previewed input",
      importPreview: makePreview(
        [
          {
            rowNumber: 1,
            raw: "NEW-1,New work",
            status: "new",
            ticket: { ticketId: "NEW-1", label: "New work" },
          },
          {
            rowNumber: 2,
            raw: "DEMO-1,Updated planning",
            status: "update",
            ticket: { ticketId: "DEMO-1", label: "Updated planning" },
          },
          {
            rowNumber: 3,
            raw: "bad row",
            status: "invalid",
            message: "Use exactly two columns: ticket ID and label.",
          },
        ],
        {
          new: 1,
          update: 1,
          unchanged: 0,
          invalid: 1,
          conflict: 0,
        }
      ),
    });
    render(<TicketImport references={references} />);

    expect(screen.getByText("New")).toBeInTheDocument();
    expect(screen.getByText("Update")).toBeInTheDocument();
    expect(screen.getByText("Invalid")).toBeInTheDocument();
    expect(screen.getByText(
      "Use exactly two columns: ticket ID and label."
    )).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", {
      name: "Import 1 new and update 1",
    }));
    expect(references.applyImport).toHaveBeenCalledTimes(1);
  });

  it("blocks confirmation while conflicts remain", () => {
    const references = makeReferences({
      importText: "conflicting input",
      importPreview: makePreview(
        [
          {
            rowNumber: 1,
            raw: "DUP-1,First",
            status: "conflict",
            ticket: { ticketId: "DUP-1", label: "First" },
            message: "This ticket ID has different labels in the pasted list.",
          },
          {
            rowNumber: 2,
            raw: "DUP-1,Second",
            status: "conflict",
            ticket: { ticketId: "DUP-1", label: "Second" },
            message: "This ticket ID has different labels in the pasted list.",
          },
        ],
        {
          new: 0,
          update: 0,
          unchanged: 0,
          invalid: 0,
          conflict: 2,
        }
      ),
    });
    render(<TicketImport references={references} />);

    expect(screen.getByText(
      "Resolve conflicting rows in the paste, then preview again."
    )).toBeInTheDocument();
    expect(screen.getByRole("button", {
      name: "Resolve conflicts to continue",
    })).toBeDisabled();
  });

  it("allows valid rows when invalid rows are also present", () => {
    const references = makeReferences({
      importText: "mixed input",
      importPreview: makePreview(
        [
          {
            rowNumber: 1,
            raw: "NEW-1,New work",
            status: "new",
            ticket: { ticketId: "NEW-1", label: "New work" },
          },
          {
            rowNumber: 2,
            raw: "broken",
            status: "invalid",
            message: "Use exactly two columns: ticket ID and label.",
          },
        ],
        {
          new: 1,
          update: 0,
          unchanged: 0,
          invalid: 1,
          conflict: 0,
        }
      ),
    });
    render(<TicketImport references={references} />);

    const importButton = screen.getByRole("button", { name: "Import 1 new" });
    expect(importButton).toBeEnabled();
    fireEvent.click(importButton);
    expect(references.applyImport).toHaveBeenCalledTimes(1);
  });
});
