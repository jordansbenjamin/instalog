import { describe, expect, it } from "vitest";
import {
  MAX_TICKET_LABEL_LENGTH,
  applyTicketImport,
  previewTicketImport,
  validateTicketReference,
} from "./ticketReference";

describe("validateTicketReference", () => {
  it("normalises whitespace and ticket ID casing", () => {
    expect(
      validateTicketReference({
        ticketId: "  demo-42 ",
        label: "  Daily planning  ",
      })
    ).toEqual({
      success: true,
      ticket: {
        ticketId: "DEMO-42",
        label: "Daily planning",
      },
    });
  });

  it.each(["", "DEMO", "42-DEMO", "DEMO_42", "DEMO-"])(
    "rejects invalid ticket ID %j",
    (ticketId) => {
      const result = validateTicketReference({
        ticketId,
        label: "Planning",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors.ticketId).toBeDefined();
      }
    }
  );

  it("rejects empty and overlong labels", () => {
    expect(
      validateTicketReference({ ticketId: "DEMO-42", label: "   " })
    ).toEqual({
      success: false,
      errors: { label: "Add a short label." },
    });

    const result = validateTicketReference({
      ticketId: "DEMO-42",
      label: "a".repeat(MAX_TICKET_LABEL_LENGTH + 1),
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors.label).toContain("80");
    }
  });
});

describe("previewTicketImport", () => {
  const existingTickets = [
    { ticketId: "DEMO-1", label: "Planning" },
    { ticketId: "TEAM-2", label: "Team meeting" },
  ];

  it("previews TSV, CSV, quoted CSV, and Markdown-link rows", () => {
    const input = [
      "NEW-1\tNew work",
      "NEW-2,Second item",
      "\"NEW-3\",\"Label, with comma\"",
      "[NEW-4](https://example.invalid/browse/NEW-4)\tLinked item",
    ].join("\n");

    const preview = previewTicketImport(input, existingTickets);

    expect(preview.rows.map((row) => row.ticket)).toEqual([
      { ticketId: "NEW-1", label: "New work" },
      { ticketId: "NEW-2", label: "Second item" },
      { ticketId: "NEW-3", label: "Label, with comma" },
      { ticketId: "NEW-4", label: "Linked item" },
    ]);
    expect(preview.counts).toEqual({
      new: 4,
      update: 0,
      unchanged: 0,
      invalid: 0,
      conflict: 0,
    });
  });

  it("classifies updates, unchanged rows, and invalid rows", () => {
    const preview = previewTicketImport(
      [
        "DEMO-1,Updated planning",
        "TEAM-2,Team meeting",
        "not-a-ticket,Broken",
        "EXTRA-3,Label,Unexpected column",
      ].join("\n"),
      existingTickets
    );

    expect(preview.rows.map((row) => row.status)).toEqual([
      "update",
      "unchanged",
      "invalid",
      "invalid",
    ]);
  });

  it("marks every differently-labelled duplicate as a conflict", () => {
    const preview = previewTicketImport(
      ["DUP-1,First label", "DUP-1,Second label"].join("\n"),
      []
    );

    expect(preview.rows.map((row) => row.status)).toEqual([
      "conflict",
      "conflict",
    ]);
    expect(preview.counts.conflict).toBe(2);
  });

  it("keeps the first identical duplicate and marks later rows unchanged", () => {
    const preview = previewTicketImport(
      ["DUP-1,Same label", "DUP-1,Same label"].join("\n"),
      []
    );

    expect(preview.rows.map((row) => row.status)).toEqual([
      "new",
      "unchanged",
    ]);
  });
});

describe("applyTicketImport", () => {
  it("appends new tickets in source order and updates without moving", () => {
    const existingTickets = [
      { ticketId: "DEMO-1", label: "Planning" },
      { ticketId: "TEAM-2", label: "Team meeting" },
    ];
    const preview = previewTicketImport(
      [
        "NEW-1,First new item",
        "DEMO-1,Updated planning",
        "NEW-2,Second new item",
      ].join("\n"),
      existingTickets
    );

    expect(applyTicketImport(preview, existingTickets)).toEqual([
      { ticketId: "DEMO-1", label: "Updated planning" },
      { ticketId: "TEAM-2", label: "Team meeting" },
      { ticketId: "NEW-1", label: "First new item" },
      { ticketId: "NEW-2", label: "Second new item" },
    ]);
    expect(existingTickets[0].label).toBe("Planning");
  });

  it("does not apply invalid, unchanged, or conflicting rows", () => {
    const preview = previewTicketImport(
      [
        "VALID-1,Valid item",
        "bad-id,Broken",
        "DUP-1,First",
        "DUP-1,Second",
      ].join("\n"),
      []
    );

    expect(applyTicketImport(preview, [])).toEqual([
      { ticketId: "VALID-1", label: "Valid item" },
    ]);
  });
});
