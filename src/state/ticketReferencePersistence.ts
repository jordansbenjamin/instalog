import {
  validateTicketReference,
  type TicketReference,
} from "../domain/ticketReference";

export interface TicketReferenceLoadResult {
  tickets: TicketReference[];
  warning: string | null;
}

const STORAGE_KEY = "instalog:ticket-references:v1";
const STORAGE_VERSION = 1;

const MALFORMED_RECORD_WARNING =
  "Saved tickets could not be read. Start with an empty list.";
const PARTIAL_RECORD_WARNING = "Some saved tickets could not be loaded.";
const LOAD_FAILURE_WARNING = "Tickets could not be loaded from this browser.";
const INVALID_SAVE_WARNING =
  "Tickets could not be saved because the list is invalid.";
const SAVE_FAILURE_WARNING = "Tickets could not be saved in this browser.";

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object";
}

function reviveTicketReferences(
  value: unknown
): TicketReferenceLoadResult | null {
  if (
    !isRecord(value) ||
    value.version !== STORAGE_VERSION ||
    !Array.isArray(value.tickets)
  ) {
    return null;
  }

  const tickets: TicketReference[] = [];
  const seenTicketIds = new Set<string>();
  let skippedItem = false;

  for (const item of value.tickets) {
    if (
      !isRecord(item) ||
      typeof item.ticketId !== "string" ||
      typeof item.label !== "string"
    ) {
      skippedItem = true;
      continue;
    }

    const validation = validateTicketReference({
      ticketId: item.ticketId,
      label: item.label,
    });

    if (
      !validation.success ||
      seenTicketIds.has(validation.ticket.ticketId)
    ) {
      skippedItem = true;
      continue;
    }

    tickets.push(validation.ticket);
    seenTicketIds.add(validation.ticket.ticketId);
  }

  return {
    tickets,
    warning: skippedItem ? PARTIAL_RECORD_WARNING : null,
  };
}

export function loadTicketReferences(): TicketReferenceLoadResult {
  let rawRecord: string | null;

  try {
    rawRecord = window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return {
      tickets: [],
      warning: LOAD_FAILURE_WARNING,
    };
  }

  if (rawRecord === null) {
    return {
      tickets: [],
      warning: null,
    };
  }

  try {
    const revivedRecord = reviveTicketReferences(JSON.parse(rawRecord));
    return (
      revivedRecord ?? {
        tickets: [],
        warning: MALFORMED_RECORD_WARNING,
      }
    );
  } catch {
    return {
      tickets: [],
      warning: MALFORMED_RECORD_WARNING,
    };
  }
}

export function saveTicketReferences(
  tickets: readonly TicketReference[]
): string | null {
  const validatedTickets: TicketReference[] = [];
  const seenTicketIds = new Set<string>();

  for (const ticket of tickets) {
    const validation = validateTicketReference(ticket);

    if (
      !validation.success ||
      seenTicketIds.has(validation.ticket.ticketId)
    ) {
      return INVALID_SAVE_WARNING;
    }

    validatedTickets.push(validation.ticket);
    seenTicketIds.add(validation.ticket.ticketId);
  }

  try {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        version: STORAGE_VERSION,
        tickets: validatedTickets,
      })
    );
    return null;
  } catch {
    return SAVE_FAILURE_WARNING;
  }
}
