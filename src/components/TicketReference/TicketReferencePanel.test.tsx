import { createRef } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { UseTicketReferencesResult } from "../../hooks/useTicketReferences";
import { TicketReferenceDrawer } from "./TicketReferenceDrawer";
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

describe("TicketReferencePanel", () => {
  it("guides an empty list into add or import flows", () => {
    const references = makeReferences();
    render(<TicketReferencePanel references={references} />);

    expect(screen.getByText("No common tickets yet.")).toBeInTheDocument();

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

describe("TicketReferenceDrawer", () => {
  it("uses dialog semantics and closes from its visible control", () => {
    const onClose = vi.fn();
    const triggerRef = createRef<HTMLButtonElement>();
    render(
      <TicketReferenceDrawer
        open
        triggerRef={triggerRef}
        onClose={onClose}
      >
        <p>Drawer content</p>
      </TicketReferenceDrawer>
    );

    expect(screen.getByRole("dialog", { name: "Common tickets" }))
      .toBeInTheDocument();
    expect(document.body.style.overflow).toBe("hidden");

    fireEvent.click(screen.getByRole("button", { name: "Close tickets" }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("closes on Escape and backdrop interaction", () => {
    const onClose = vi.fn();
    const triggerRef = createRef<HTMLButtonElement>();
    const { rerender } = render(
      <TicketReferenceDrawer
        open
        triggerRef={triggerRef}
        onClose={onClose}
      >
        <p>Drawer content</p>
      </TicketReferenceDrawer>
    );

    fireEvent.keyDown(window, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);

    const backdrop = screen.getByTestId("ticket-drawer-backdrop");
    fireEvent.mouseDown(backdrop);
    expect(onClose).toHaveBeenCalledTimes(2);

    const child = screen.getByText("Drawer content");
    fireEvent.mouseDown(child);
    expect(onClose).toHaveBeenCalledTimes(2);

    rerender(
      <TicketReferenceDrawer
        open={false}
        triggerRef={triggerRef}
        onClose={onClose}
      >
        <p>Drawer content</p>
      </TicketReferenceDrawer>
    );
    expect(document.body.style.overflow).toBe("");
  });

  it("restores focus to the trigger after closing", () => {
    const onClose = vi.fn();
    const triggerRef = createRef<HTMLButtonElement>();
    const { rerender } = render(
      <>
        <button ref={triggerRef}>Open tickets</button>
        <TicketReferenceDrawer
          open
          triggerRef={triggerRef}
          onClose={onClose}
        >
          <button>Inner action</button>
        </TicketReferenceDrawer>
      </>
    );

    expect(screen.getByRole("button", { name: "Close tickets" }))
      .toHaveFocus();

    rerender(
      <>
        <button ref={triggerRef}>Open tickets</button>
        <TicketReferenceDrawer
          open={false}
          triggerRef={triggerRef}
          onClose={onClose}
        >
          <button>Inner action</button>
        </TicketReferenceDrawer>
      </>
    );

    expect(screen.getByRole("button", { name: "Open tickets" })).toHaveFocus();
  });
});
