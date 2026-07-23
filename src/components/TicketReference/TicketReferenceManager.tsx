import {
  useEffect,
  useRef,
  type CSSProperties,
  type RefCallback,
} from "react";
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type {
  TicketReferenceDraftRow,
  UseTicketReferencesResult,
} from "../../hooks/useTicketReferences";
import type { TicketReferenceFieldErrors } from "../../domain/ticketReference";
import { Button } from "../../ui/Button/Button";
import { Icons } from "../../ui/icons/Icons";
import styles from "./TicketReferenceManager.module.css";

interface TicketReferenceManagerProps {
  references: UseTicketReferencesResult;
  headingId?: string;
}

interface SortableTicketRowProps {
  row: TicketReferenceDraftRow;
  index: number;
  totalRows: number;
  errors?: TicketReferenceFieldErrors;
  inputRef: RefCallback<HTMLInputElement>;
  onUpdate(ticket: { ticketId: string; label: string }): void;
  onDelete(): void;
  onMove(fromIndex: number, toIndex: number): void;
}

function SortableTicketRow({
  row,
  index,
  totalRows,
  errors,
  inputRef,
  onUpdate,
  onDelete,
  onMove,
}: SortableTicketRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: row.draftId });
  const rowStyle: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };
  const displayTicketId = row.ticketId.trim() || `ticket ${index + 1}`;
  const ticketIdErrorId = `${row.draftId}-ticket-id-error`;
  const labelErrorId = `${row.draftId}-label-error`;

  return (
    <li
      ref={setNodeRef}
      className={`${styles.row} ${isDragging ? styles.dragging : ""}`}
      style={rowStyle}
    >
      <div className={styles.rowTop}>
        <button
          ref={setActivatorNodeRef}
          type="button"
          className={styles.dragHandle}
          aria-label={`Drag ${displayTicketId} to reorder`}
          {...attributes}
          {...listeners}
        >
          <Icons.grip width="15" height="15" aria-hidden="true" />
        </button>
        <span className={styles.rowNumber}>Ticket {index + 1}</span>
        <div className={styles.rowActions}>
          <button
            type="button"
            className={styles.rowAction}
            aria-label={`Move ${displayTicketId} up`}
            disabled={index === 0}
            onClick={() => onMove(index, index - 1)}
          >
            <Icons.up width="14" height="14" aria-hidden="true" />
          </button>
          <button
            type="button"
            className={styles.rowAction}
            aria-label={`Move ${displayTicketId} down`}
            disabled={index === totalRows - 1}
            onClick={() => onMove(index, index + 1)}
          >
            <Icons.down width="14" height="14" aria-hidden="true" />
          </button>
          <button
            type="button"
            className={`${styles.rowAction} ${styles.deleteAction}`}
            aria-label={`Delete ${displayTicketId}`}
            onClick={onDelete}
          >
            <Icons.trash width="14" height="14" aria-hidden="true" />
          </button>
        </div>
      </div>

      <label className={styles.field}>
        <span>Ticket ID</span>
        <input
          ref={inputRef}
          value={row.ticketId}
          aria-label={`Ticket ID for ticket ${index + 1}`}
          aria-invalid={Boolean(errors?.ticketId)}
          aria-describedby={errors?.ticketId ? ticketIdErrorId : undefined}
          placeholder="DEMO-42"
          autoCapitalize="characters"
          spellCheck={false}
          onChange={(event) =>
            onUpdate({
              ticketId: event.target.value,
              label: row.label,
            })
          }
        />
        {errors?.ticketId && (
          <span id={ticketIdErrorId} className={styles.error}>
            {errors.ticketId}
          </span>
        )}
      </label>

      <label className={styles.field}>
        <span>Label</span>
        <input
          value={row.label}
          aria-label={`Label for ticket ${index + 1}`}
          aria-invalid={Boolean(errors?.label)}
          aria-describedby={errors?.label ? labelErrorId : undefined}
          placeholder="Daily planning"
          maxLength={81}
          onChange={(event) =>
            onUpdate({
              ticketId: row.ticketId,
              label: event.target.value,
            })
          }
        />
        {errors?.label && (
          <span id={labelErrorId} className={styles.error}>
            {errors.label}
          </span>
        )}
      </label>
    </li>
  );
}

export function TicketReferenceManager({
  references,
  headingId = "ticket-manager-heading",
}: TicketReferenceManagerProps) {
  const inputRefs = useRef(new Map<string, HTMLInputElement>());
  const previousDraftLength = useRef(0);
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 180, tolerance: 5 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    if (references.draft.length > previousDraftLength.current) {
      const lastRow = references.draft[references.draft.length - 1];
      if (lastRow?.ticketId.trim().length === 0) {
        inputRefs.current.get(lastRow.draftId)?.focus();
      }
    }
    previousDraftLength.current = references.draft.length;
  }, [references.draft]);

  const handleDragEnd = ({ active, over }: DragEndEvent): void => {
    if (!over || active.id === over.id) {
      return;
    }

    const fromIndex = references.draft.findIndex(
      (row) => row.draftId === active.id
    );
    const toIndex = references.draft.findIndex(
      (row) => row.draftId === over.id
    );
    references.moveDraftTicket(fromIndex, toIndex);
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    references.saveDraft();
  };

  return (
    <form className={styles.manager} onSubmit={handleSubmit}>
      <div className={styles.header}>
        <span className={styles.eyebrow}>Edit reference</span>
        <h2 id={headingId} className={styles.heading}>Manage tickets</h2>
        <p className={styles.description}>
          Reorder your most useful tickets. Changes stay local until saved.
        </p>
      </div>

      <div className={styles.toolbar}>
        <button
          type="button"
          className={styles.toolbarAction}
          onClick={references.addDraftTicket}
        >
          <Icons.plus width="14" height="14" aria-hidden="true" />
          Add ticket
        </button>
        <button
          type="button"
          className={styles.toolbarAction}
          onClick={references.startImport}
        >
          <Icons.download width="14" height="14" aria-hidden="true" />
          Import list
        </button>
      </div>

      {references.draft.length === 0 ? (
        <div className={styles.empty}>
          <p>Your list is empty.</p>
          <button type="button" onClick={references.addDraftTicket}>
            Add the first ticket
          </button>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={references.draft.map((row) => row.draftId)}
            strategy={verticalListSortingStrategy}
          >
            <ol className={styles.rows}>
              {references.draft.map((row, index) => (
                <SortableTicketRow
                  key={row.draftId}
                  row={row}
                  index={index}
                  totalRows={references.draft.length}
                  errors={references.draftErrors[row.draftId]}
                  inputRef={(element) => {
                    if (element) {
                      inputRefs.current.set(row.draftId, element);
                    } else {
                      inputRefs.current.delete(row.draftId);
                    }
                  }}
                  onUpdate={(ticket) =>
                    references.updateDraftTicket(row.draftId, ticket)
                  }
                  onDelete={() =>
                    references.deleteDraftTicket(row.draftId)
                  }
                  onMove={references.moveDraftTicket}
                />
              ))}
            </ol>
          </SortableContext>
        </DndContext>
      )}

      <div className={styles.footer}>
        <Button type="button" onClick={references.cancelManaging}>
          Cancel
        </Button>
        <Button type="submit" variant="primary">
          Save changes
        </Button>
      </div>
    </form>
  );
}
