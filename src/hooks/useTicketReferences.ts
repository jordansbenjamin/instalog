import { useEffect, useMemo, useRef, useState } from "react";
import {
  applyTicketImport,
  normalizeTicketReference,
  previewTicketImport,
  validateTicketReference,
  type TicketImportPreview,
  type TicketReference,
  type TicketReferenceFieldErrors,
} from "../domain/ticketReference";
import {
  loadTicketReferences,
  saveTicketReferences,
} from "../state/ticketReferencePersistence";

export type TicketReferenceMode = "reference" | "manage" | "import";

export interface TicketReferenceDraftRow extends TicketReference {
  draftId: string;
}

export type TicketReferenceDraftErrors = Record<
  string,
  TicketReferenceFieldErrors
>;

export interface UseTicketReferencesResult {
  tickets: TicketReference[];
  visibleTickets: TicketReference[];
  draft: TicketReferenceDraftRow[];
  draftErrors: TicketReferenceDraftErrors;
  mode: TicketReferenceMode;
  search: string;
  message: string | null;
  warning: string | null;
  importText: string;
  importPreview: TicketImportPreview | null;
  setSearch(search: string): void;
  copyTicketId(ticketId: string): Promise<boolean>;
  startManaging(): void;
  cancelManaging(): void;
  addDraftTicket(): void;
  updateDraftTicket(draftId: string, ticket: TicketReference): void;
  deleteDraftTicket(draftId: string): void;
  moveDraftTicket(fromIndex: number, toIndex: number): void;
  saveDraft(): boolean;
  startImport(): void;
  cancelImport(): void;
  setImportText(text: string): void;
  previewImport(): void;
  applyImport(): void;
}

const COPY_MESSAGE_DURATION_MS = 2400;

function draftRowsToTickets(
  rows: readonly TicketReferenceDraftRow[]
): TicketReference[] {
  return rows.map(({ ticketId, label }) =>
    normalizeTicketReference({ ticketId, label })
  );
}

export function useTicketReferences(): UseTicketReferencesResult {
  const [initialLoad] = useState(loadTicketReferences);
  const [tickets, setTickets] = useState<TicketReference[]>(
    initialLoad.tickets
  );
  const [draft, setDraft] = useState<TicketReferenceDraftRow[]>([]);
  const [draftErrors, setDraftErrors] =
    useState<TicketReferenceDraftErrors>({});
  const [mode, setMode] = useState<TicketReferenceMode>("reference");
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(initialLoad.warning);
  const [importText, setStoredImportText] = useState("");
  const [importPreview, setImportPreview] =
    useState<TicketImportPreview | null>(null);
  const nextDraftId = useRef(0);

  const createDraftRow = (ticket: TicketReference): TicketReferenceDraftRow => {
    nextDraftId.current += 1;
    return {
      draftId: `ticket-draft-${nextDraftId.current}`,
      ...ticket,
    };
  };

  const visibleTickets = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    if (normalizedSearch.length === 0) {
      return tickets;
    }

    return tickets.filter(
      (ticket) =>
        ticket.ticketId.toLowerCase().includes(normalizedSearch) ||
        ticket.label.toLowerCase().includes(normalizedSearch)
    );
  }, [search, tickets]);

  useEffect(() => {
    if (message === null) {
      return;
    }

    const timeout = window.setTimeout(() => {
      setMessage(null);
    }, COPY_MESSAGE_DURATION_MS);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [message]);

  const copyTicketId = async (ticketId: string): Promise<boolean> => {
    try {
      if (!navigator.clipboard) {
        throw new Error("Clipboard API unavailable");
      }

      await navigator.clipboard.writeText(ticketId);
      setMessage(`Copied ${ticketId}`);
      return true;
    } catch {
      setMessage(
        "Could not copy automatically. Select the ticket ID to copy it."
      );
      return false;
    }
  };

  const startManaging = (): void => {
    setDraft(tickets.map((ticket) => createDraftRow(ticket)));
    setDraftErrors({});
    setImportPreview(null);
    setStoredImportText("");
    setMode("manage");
  };

  const cancelManaging = (): void => {
    setDraft([]);
    setDraftErrors({});
    setImportPreview(null);
    setStoredImportText("");
    setMode("reference");
  };

  const addDraftTicket = (): void => {
    setDraft((currentDraft) => [
      ...currentDraft,
      createDraftRow({ ticketId: "", label: "" }),
    ]);
  };

  const updateDraftTicket = (
    draftId: string,
    ticket: TicketReference
  ): void => {
    setDraft((currentDraft) =>
      currentDraft.map((row) =>
        row.draftId === draftId ? { ...row, ...ticket } : row
      )
    );
    setDraftErrors((currentErrors) => {
      if (!(draftId in currentErrors)) {
        return currentErrors;
      }

      const nextErrors = { ...currentErrors };
      delete nextErrors[draftId];
      return nextErrors;
    });
  };

  const deleteDraftTicket = (draftId: string): void => {
    setDraft((currentDraft) =>
      currentDraft.filter((row) => row.draftId !== draftId)
    );
    setDraftErrors((currentErrors) => {
      if (!(draftId in currentErrors)) {
        return currentErrors;
      }

      const nextErrors = { ...currentErrors };
      delete nextErrors[draftId];
      return nextErrors;
    });
  };

  const moveDraftTicket = (fromIndex: number, toIndex: number): void => {
    setDraft((currentDraft) => {
      if (
        fromIndex < 0 ||
        fromIndex >= currentDraft.length ||
        toIndex < 0 ||
        toIndex >= currentDraft.length ||
        fromIndex === toIndex
      ) {
        return currentDraft;
      }

      const nextDraft = [...currentDraft];
      const [movedRow] = nextDraft.splice(fromIndex, 1);
      nextDraft.splice(toIndex, 0, movedRow);
      return nextDraft;
    });
  };

  const saveDraft = (): boolean => {
    const nextErrors: TicketReferenceDraftErrors = {};
    const validatedTickets: TicketReference[] = [];
    const draftIdsByTicketId = new Map<string, string[]>();

    for (const row of draft) {
      const validation = validateTicketReference(row);
      if (!validation.success) {
        nextErrors[row.draftId] = { ...validation.errors };
      } else {
        validatedTickets.push(validation.ticket);
      }

      const normalizedTicket = normalizeTicketReference(row);
      if (normalizedTicket.ticketId.length > 0) {
        const matchingDraftIds =
          draftIdsByTicketId.get(normalizedTicket.ticketId) ?? [];
        matchingDraftIds.push(row.draftId);
        draftIdsByTicketId.set(normalizedTicket.ticketId, matchingDraftIds);
      }
    }

    for (const matchingDraftIds of draftIdsByTicketId.values()) {
      if (matchingDraftIds.length < 2) {
        continue;
      }

      for (const draftId of matchingDraftIds) {
        nextErrors[draftId] = {
          ...nextErrors[draftId],
          ticketId: "Ticket IDs must be unique.",
        };
      }
    }

    if (Object.keys(nextErrors).length > 0) {
      setDraftErrors(nextErrors);
      return false;
    }

    const saveWarning = saveTicketReferences(validatedTickets);
    setTickets(validatedTickets);
    setWarning(saveWarning);
    setDraft([]);
    setDraftErrors({});
    setMode("reference");
    return true;
  };

  const startImport = (): void => {
    setStoredImportText("");
    setImportPreview(null);
    setMode("import");
  };

  const cancelImport = (): void => {
    setStoredImportText("");
    setImportPreview(null);
    setMode("manage");
  };

  const setImportText = (text: string): void => {
    setStoredImportText(text);
    setImportPreview(null);
  };

  const previewImport = (): void => {
    setImportPreview(
      previewTicketImport(importText, draftRowsToTickets(draft))
    );
  };

  const applyImport = (): void => {
    if (
      importPreview === null ||
      importPreview.counts.conflict > 0 ||
      importPreview.counts.new + importPreview.counts.update === 0
    ) {
      return;
    }

    const importedTickets = applyTicketImport(
      importPreview,
      draftRowsToTickets(draft)
    );
    const existingRowsByTicketId = new Map(
      draft.map((row) => [
        normalizeTicketReference(row).ticketId,
        row,
      ])
    );

    setDraft(
      importedTickets.map((ticket) => {
        const existingRow = existingRowsByTicketId.get(ticket.ticketId);
        return existingRow
          ? { ...existingRow, ...ticket }
          : createDraftRow(ticket);
      })
    );
    setDraftErrors({});
    setStoredImportText("");
    setImportPreview(null);
    setMode("manage");
  };

  return {
    tickets,
    visibleTickets,
    draft,
    draftErrors,
    mode,
    search,
    message,
    warning,
    importText,
    importPreview,
    setSearch,
    copyTicketId,
    startManaging,
    cancelManaging,
    addDraftTicket,
    updateDraftTicket,
    deleteDraftTicket,
    moveDraftTicket,
    saveDraft,
    startImport,
    cancelImport,
    setImportText,
    previewImport,
    applyImport,
  };
}
