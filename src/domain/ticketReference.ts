export interface TicketReference {
  ticketId: string;
  label: string;
}

export interface TicketReferenceFieldErrors {
  ticketId?: string;
  label?: string;
}

export type TicketReferenceValidation =
  | { success: true; ticket: TicketReference }
  | { success: false; errors: TicketReferenceFieldErrors };

export type TicketImportStatus =
  | "new"
  | "update"
  | "unchanged"
  | "invalid"
  | "conflict";

export interface TicketImportPreviewRow {
  rowNumber: number;
  raw: string;
  status: TicketImportStatus;
  ticket?: TicketReference;
  message?: string;
}

export interface TicketImportCounts {
  new: number;
  update: number;
  unchanged: number;
  invalid: number;
  conflict: number;
}

export interface TicketImportPreview {
  rows: TicketImportPreviewRow[];
  counts: TicketImportCounts;
}

export const MAX_TICKET_LABEL_LENGTH = 80;

const TICKET_ID_PATTERN = /^[A-Z][A-Z0-9]*-\d+$/;
const MARKDOWN_LINK_PATTERN = /^\[([^\]]+)\]\([^)]+\)$/;

interface ParsedImportRow {
  rowNumber: number;
  raw: string;
  ticket?: TicketReference;
  message?: string;
}

export function normalizeTicketReference(
  ticket: TicketReference
): TicketReference {
  return {
    ticketId: ticket.ticketId.trim().toUpperCase(),
    label: ticket.label.trim(),
  };
}

export function validateTicketReference(
  ticket: TicketReference
): TicketReferenceValidation {
  const normalizedTicket = normalizeTicketReference(ticket);
  const errors: TicketReferenceFieldErrors = {};

  if (!TICKET_ID_PATTERN.test(normalizedTicket.ticketId)) {
    errors.ticketId = "Use a ticket ID like DEMO-42.";
  }

  if (normalizedTicket.label.length === 0) {
    errors.label = "Add a short label.";
  } else if (normalizedTicket.label.length > MAX_TICKET_LABEL_LENGTH) {
    errors.label = `Keep the label to ${MAX_TICKET_LABEL_LENGTH} characters or fewer.`;
  }

  return Object.keys(errors).length > 0
    ? { success: false, errors }
    : { success: true, ticket: normalizedTicket };
}

function parseCsvColumns(row: string): string[] | null {
  const columns: string[] = [];
  let currentColumn = "";
  let insideQuotes = false;
  let quotedColumn = false;
  let closedQuote = false;

  for (let characterIndex = 0; characterIndex < row.length; characterIndex += 1) {
    const character = row[characterIndex];

    if (character === "\"") {
      if (insideQuotes && row[characterIndex + 1] === "\"") {
        currentColumn += "\"";
        characterIndex += 1;
      } else if (insideQuotes) {
        insideQuotes = false;
        closedQuote = true;
      } else if (currentColumn.length === 0 && !quotedColumn) {
        insideQuotes = true;
        quotedColumn = true;
      } else {
        return null;
      }
    } else if (character === "," && !insideQuotes) {
      columns.push(currentColumn);
      currentColumn = "";
      quotedColumn = false;
      closedQuote = false;
    } else if (closedQuote) {
      return null;
    } else {
      currentColumn += character;
    }
  }

  if (insideQuotes) {
    return null;
  }

  columns.push(currentColumn);
  return columns;
}

function parseImportColumns(row: string): string[] | null {
  if (row.includes("\t")) {
    return row.split("\t");
  }

  return parseCsvColumns(row);
}

function unwrapMarkdownTicketId(value: string): string {
  const markdownMatch = value.trim().match(MARKDOWN_LINK_PATTERN);
  return markdownMatch ? markdownMatch[1] : value;
}

function parseImportRow(raw: string, rowNumber: number): ParsedImportRow {
  const columns = parseImportColumns(raw);

  if (!columns || columns.length !== 2) {
    return {
      rowNumber,
      raw,
      message: "Use exactly two columns: ticket ID and label.",
    };
  }

  const validation = validateTicketReference({
    ticketId: unwrapMarkdownTicketId(columns[0]),
    label: columns[1],
  });

  if (!validation.success) {
    return {
      rowNumber,
      raw,
      message: Object.values(validation.errors).join(" "),
    };
  }

  return {
    rowNumber,
    raw,
    ticket: validation.ticket,
  };
}

function countPreviewRows(
  rows: readonly TicketImportPreviewRow[]
): TicketImportCounts {
  const counts: TicketImportCounts = {
    new: 0,
    update: 0,
    unchanged: 0,
    invalid: 0,
    conflict: 0,
  };

  for (const row of rows) {
    counts[row.status] += 1;
  }

  return counts;
}

export function previewTicketImport(
  input: string,
  existingTickets: readonly TicketReference[]
): TicketImportPreview {
  const parsedRows = input
    .split(/\r?\n/)
    .map((raw, rowIndex) => ({ raw, rowNumber: rowIndex + 1 }))
    .filter(({ raw }) => raw.trim().length > 0)
    .map(({ raw, rowNumber }) => parseImportRow(raw, rowNumber));

  const labelsByTicketId = new Map<string, Set<string>>();
  for (const row of parsedRows) {
    if (!row.ticket) {
      continue;
    }

    const labels = labelsByTicketId.get(row.ticket.ticketId) ?? new Set<string>();
    labels.add(row.ticket.label);
    labelsByTicketId.set(row.ticket.ticketId, labels);
  }

  const existingByTicketId = new Map(
    existingTickets.map((ticket) => [ticket.ticketId, ticket])
  );
  const seenTicketIds = new Set<string>();

  const rows = parsedRows.map<TicketImportPreviewRow>((row) => {
    if (!row.ticket) {
      return {
        rowNumber: row.rowNumber,
        raw: row.raw,
        status: "invalid",
        message: row.message,
      };
    }

    const conflictingLabels = labelsByTicketId.get(row.ticket.ticketId);
    if (conflictingLabels && conflictingLabels.size > 1) {
      return {
        rowNumber: row.rowNumber,
        raw: row.raw,
        status: "conflict",
        ticket: row.ticket,
        message: "This ticket ID has different labels in the pasted list.",
      };
    }

    if (seenTicketIds.has(row.ticket.ticketId)) {
      return {
        rowNumber: row.rowNumber,
        raw: row.raw,
        status: "unchanged",
        ticket: row.ticket,
        message: "Duplicate row.",
      };
    }

    seenTicketIds.add(row.ticket.ticketId);
    const existingTicket = existingByTicketId.get(row.ticket.ticketId);

    if (!existingTicket) {
      return {
        rowNumber: row.rowNumber,
        raw: row.raw,
        status: "new",
        ticket: row.ticket,
      };
    }

    if (existingTicket.label === row.ticket.label) {
      return {
        rowNumber: row.rowNumber,
        raw: row.raw,
        status: "unchanged",
        ticket: row.ticket,
      };
    }

    return {
      rowNumber: row.rowNumber,
      raw: row.raw,
      status: "update",
      ticket: row.ticket,
    };
  });

  return {
    rows,
    counts: countPreviewRows(rows),
  };
}

export function applyTicketImport(
  preview: TicketImportPreview,
  existingTickets: readonly TicketReference[]
): TicketReference[] {
  const updatesByTicketId = new Map(
    preview.rows
      .filter(
        (
          row
        ): row is TicketImportPreviewRow & { ticket: TicketReference } =>
          row.status === "update" && row.ticket !== undefined
      )
      .map((row) => [row.ticket.ticketId, row.ticket])
  );

  const updatedExistingTickets = existingTickets.map((ticket) => {
    const update = updatesByTicketId.get(ticket.ticketId);
    return update ? { ...update } : { ...ticket };
  });

  const newTickets = preview.rows
    .filter(
      (
        row
      ): row is TicketImportPreviewRow & { ticket: TicketReference } =>
        row.status === "new" && row.ticket !== undefined
    )
    .map((row) => ({ ...row.ticket }));

  return [...updatedExistingTickets, ...newTickets];
}
