'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ApiError,
  createTicket,
  deleteTicket,
  getTicketSummariesByProject,
  type Ticket,
  type TicketPayload,
  type TicketSummary,
  updateTicket,
} from '@/lib/api';
import { TicketComments } from '@/components/TicketComments';

const ticketStatuses: Ticket['status'][] = [
  'TODO',
  'IN_PROGRESS',
  'IN_REVIEW',
  'DONE',
];

const priorities: Ticket['priority'][] = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];

const statusLabels: Record<Ticket['status'], string> = {
  TODO: 'To Do',
  IN_PROGRESS: 'In Progress',
  IN_REVIEW: 'In Review',
  DONE: 'Done',
};

const priorityClasses: Record<Ticket['priority'], string> = {
  LOW: 'bg-slate-100 text-slate-700',
  MEDIUM: 'bg-sky-100 text-sky-800',
  HIGH: 'bg-amber-100 text-amber-800',
  URGENT: 'bg-rose-100 text-rose-800',
};

interface TicketBoardProps {
  projectId: string;
  initialTickets: TicketSummary[];
}

function toTicketSummary(ticket: Ticket, previous?: TicketSummary | null): TicketSummary {
  return {
    ...ticket,
    commentCount: previous?.commentCount ?? 0,
  };
}

export function TicketBoard({ projectId, initialTickets }: TicketBoardProps) {
  const [tickets, setTickets] = useState(initialTickets);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<Ticket['status'] | 'ALL'>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<Ticket['priority'] | 'ALL'>('ALL');
  const [sortBy, setSortBy] = useState<'createdAt' | 'updatedAt' | 'priority'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [boardError, setBoardError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let active = true;
    setIsLoading(true);
    setBoardError(null);

    getTicketSummariesByProject(projectId, {
      status: statusFilter === 'ALL' ? undefined : statusFilter,
      priority: priorityFilter === 'ALL' ? undefined : priorityFilter,
      sortBy,
      sortOrder,
    })
      .then((nextTickets) => {
        if (!active) {
          return;
        }

        setTickets(nextTickets);
        setSelectedTicketId((current) =>
          current && nextTickets.some((ticket) => ticket.id === current) ? current : null,
        );
      })
      .catch((error) => {
        if (!active) {
          return;
        }

        setBoardError(
          error instanceof ApiError
            ? error.message
            : 'Could not load tickets for this project.',
        );
      })
      .finally(() => {
        if (active) {
          setIsLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [priorityFilter, projectId, sortBy, sortOrder, statusFilter]);

  const selectedTicket = useMemo(
    () => tickets.find((ticket) => ticket.id === selectedTicketId) ?? null,
    [selectedTicketId, tickets],
  );

  const groupedTickets = useMemo(
    () =>
      ticketStatuses.map((status) => ({
        status,
        tickets: tickets.filter((ticket) => ticket.status === status),
      })),
    [tickets],
  );

  const updateTicketInState = useCallback(
    (ticketId: string, updater: (ticket: TicketSummary) => TicketSummary) => {
      setTickets((current) =>
        current.map((ticket) => (ticket.id === ticketId ? updater(ticket) : ticket)),
      );
    },
    [],
  );

  async function handleCreateTicket(payload: TicketPayload) {
    const createdTicket = await createTicket(projectId, payload);
    setShowCreateForm(false);
    setTickets((current) => [toTicketSummary(createdTicket), ...current]);
    setSelectedTicketId(createdTicket.id);
  }

  async function handleUpdateTicket(ticketId: string, payload: TicketPayload) {
    const currentTicket = tickets.find((ticket) => ticket.id === ticketId) ?? null;
    const updatedTicket = await updateTicket(ticketId, payload);

    setTickets((current) =>
      current.map((ticket) =>
        ticket.id === ticketId ? toTicketSummary(updatedTicket, currentTicket) : ticket,
      ),
    );
    setSelectedTicketId(ticketId);
  }

  async function handleDeleteTicket(ticketId: string) {
    await deleteTicket(ticketId);
    setTickets((current) => current.filter((ticket) => ticket.id !== ticketId));
    setSelectedTicketId((current) => (current === ticketId ? null : current));
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Day 8 Tickets UI</p>
            <h3 className="mt-2 text-xl font-semibold text-slate-900">Ticket Board</h3>
            <p className="mt-1 text-sm text-slate-600">
              Manage tickets by status, priority, and recent activity.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowCreateForm((value) => !value)}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700"
          >
            {showCreateForm ? 'Close Form' : 'New Ticket'}
          </button>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <label className="block">
            <span className="mb-1 block text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
              Status
            </span>
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as Ticket['status'] | 'ALL')}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-500"
            >
              <option value="ALL">All statuses</option>
              {ticketStatuses.map((status) => (
                <option key={status} value={status}>
                  {statusLabels[status]}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-1 block text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
              Priority
            </span>
            <select
              value={priorityFilter}
              onChange={(event) =>
                setPriorityFilter(event.target.value as Ticket['priority'] | 'ALL')
              }
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-500"
            >
              <option value="ALL">All priorities</option>
              {priorities.map((priority) => (
                <option key={priority} value={priority}>
                  {priority}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-1 block text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
              Sort By
            </span>
            <select
              value={sortBy}
              onChange={(event) =>
                setSortBy(event.target.value as 'createdAt' | 'updatedAt' | 'priority')
              }
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-500"
            >
              <option value="createdAt">Created date</option>
              <option value="updatedAt">Updated date</option>
              <option value="priority">Priority</option>
            </select>
          </label>

          <label className="block">
            <span className="mb-1 block text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
              Order
            </span>
            <select
              value={sortOrder}
              onChange={(event) => setSortOrder(event.target.value as 'asc' | 'desc')}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-500"
            >
              <option value="desc">Descending</option>
              <option value="asc">Ascending</option>
            </select>
          </label>
        </div>

        {showCreateForm ? (
          <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="mb-3 text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
              Create Ticket
            </p>
            <TicketForm
              mode="create"
              onCancel={() => setShowCreateForm(false)}
              onSubmit={handleCreateTicket}
            />
          </div>
        ) : null}
      </div>

      {boardError ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          {boardError}
        </div>
      ) : null}

      {isLoading ? (
        <div className="grid gap-4 xl:grid-cols-4">
          {ticketStatuses.map((status) => (
            <div key={status} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="h-5 w-24 animate-pulse rounded bg-slate-200" />
              <div className="mt-4 space-y-3">
                {Array.from({ length: 2 }).map((_, index) => (
                  <div key={index} className="rounded-lg border border-slate-200 p-3">
                    <div className="h-4 w-3/4 animate-pulse rounded bg-slate-200" />
                    <div className="mt-2 h-4 w-1/2 animate-pulse rounded bg-slate-100" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="grid gap-4 xl:grid-cols-4">
            {groupedTickets.map((column) => (
              <section
                key={column.status}
                className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
              >
                <div className="flex items-center justify-between gap-3">
                  <h4 className="text-sm font-semibold text-slate-900">
                    {statusLabels[column.status]}
                  </h4>
                  <span className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-600">
                    {column.tickets.length}
                  </span>
                </div>

                <div className="mt-4 space-y-3">
                  {column.tickets.length === 0 ? (
                    <p className="rounded-lg border border-dashed border-slate-200 p-3 text-sm text-slate-500">
                      No tickets in this column.
                    </p>
                  ) : (
                    column.tickets.map((ticket) => (
                      <article
                        key={ticket.id}
                        className={`rounded-lg border p-3 transition ${
                          selectedTicketId === ticket.id
                            ? 'border-slate-900 bg-slate-50'
                            : 'border-slate-200 bg-white hover:border-slate-300'
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => setSelectedTicketId(ticket.id)}
                          className="w-full text-left"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <p className="text-sm font-semibold text-slate-900">{ticket.title}</p>
                            <span
                              className={`rounded-md px-2 py-1 text-[11px] font-semibold ${priorityClasses[ticket.priority]}`}
                            >
                              {ticket.priority}
                            </span>
                          </div>
                          <p className="mt-2 line-clamp-3 text-sm text-slate-600">
                            {ticket.description || 'No description yet.'}
                          </p>
                        </button>

                        <div className="mt-3 flex items-center justify-between gap-3">
                          <span className="text-xs text-slate-500">
                            {ticket.commentCount} comment{ticket.commentCount === 1 ? '' : 's'}
                          </span>
                          <span className="text-xs text-slate-400">
                            Updated {new Date(ticket.updatedAt).toLocaleDateString()}
                          </span>
                        </div>

                        <div className="mt-3 flex items-center justify-between gap-3">
                          <select
                            value={ticket.status}
                            onChange={(event) =>
                              handleUpdateTicket(ticket.id, {
                                status: event.target.value as Ticket['status'],
                              }).catch((error) =>
                                setBoardError(
                                  error instanceof ApiError
                                    ? error.message
                                    : 'Could not update ticket status.',
                                ),
                              )
                            }
                            className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs text-slate-700 outline-none transition focus:border-slate-500"
                          >
                            {ticketStatuses.map((status) => (
                              <option key={status} value={status}>
                                {statusLabels[status]}
                              </option>
                            ))}
                          </select>
                        </div>
                      </article>
                    ))
                  )}
                </div>
              </section>
            ))}
          </div>

          <aside className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            {selectedTicket ? (
              <TicketDetailPanel
                ticket={selectedTicket}
                onDelete={handleDeleteTicket}
                onUpdate={handleUpdateTicket}
                onCommentCountChange={(nextCount) =>
                  updateTicketInState(selectedTicket.id, (currentTicket) => ({
                    ...currentTicket,
                    commentCount: nextCount,
                    updatedAt: new Date().toISOString(),
                  }))
                }
              />
            ) : (
              <div className="flex h-full min-h-72 items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500">
                Select a ticket card to view details, edit fields, or delete it.
              </div>
            )}
          </aside>
        </div>
      )}
    </div>
  );
}

interface TicketFormProps {
  mode: 'create' | 'edit';
  initialTicket?: TicketSummary;
  onCancel?: () => void;
  onSubmit: (payload: TicketPayload) => Promise<void>;
}

function TicketForm({ mode, initialTicket, onCancel, onSubmit }: TicketFormProps) {
  const [title, setTitle] = useState(initialTicket?.title ?? '');
  const [description, setDescription] = useState(initialTicket?.description ?? '');
  const [status, setStatus] = useState<Ticket['status']>(initialTicket?.status ?? 'TODO');
  const [priority, setPriority] = useState<Ticket['priority']>(
    initialTicket?.priority ?? 'MEDIUM',
  );
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedTitle = title.trim();
    const normalizedDescription = description.trim();

    if (normalizedTitle.length < 3) {
      setError('Ticket title must be at least 3 characters.');
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      await onSubmit({
        title: normalizedTitle,
        description: normalizedDescription || undefined,
        status,
        priority,
      });
    } catch (error) {
      setError(
        error instanceof ApiError ? error.message : 'Could not save the ticket right now.',
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <label className="block">
        <span className="mb-1 block text-sm font-medium text-slate-700">Title</span>
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Fix login bug"
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-500"
        />
      </label>

      <label className="block">
        <span className="mb-1 block text-sm font-medium text-slate-700">Description</span>
        <textarea
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          rows={4}
          placeholder="Describe the task or issue"
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-500"
        />
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-slate-700">Status</span>
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value as Ticket['status'])}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-500"
          >
            {ticketStatuses.map((ticketStatus) => (
              <option key={ticketStatus} value={ticketStatus}>
                {statusLabels[ticketStatus]}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-medium text-slate-700">Priority</span>
          <select
            value={priority}
            onChange={(event) => setPriority(event.target.value as Ticket['priority'])}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-500"
          >
            {priorities.map((ticketPriority) => (
              <option key={ticketPriority} value={ticketPriority}>
                {ticketPriority}
              </option>
            ))}
          </select>
        </label>
      </div>

      {error ? (
        <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {error}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700 disabled:cursor-wait disabled:bg-slate-400"
        >
          {isSubmitting
            ? mode === 'create'
              ? 'Creating...'
              : 'Saving...'
            : mode === 'create'
              ? 'Create Ticket'
              : 'Save Ticket'}
        </button>
        {onCancel ? (
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:text-slate-900"
          >
            Cancel
          </button>
        ) : null}
      </div>
    </form>
  );
}

interface TicketDetailPanelProps {
  ticket: TicketSummary;
  onUpdate: (ticketId: string, payload: TicketPayload) => Promise<void>;
  onDelete: (ticketId: string) => Promise<void>;
  onCommentCountChange: (nextCount: number) => void;
}

function TicketDetailPanel({
  ticket,
  onUpdate,
  onDelete,
  onCommentCountChange,
}: TicketDetailPanelProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleDelete() {
    setError(null);
    setIsDeleting(true);

    try {
      await onDelete(ticket.id);
    } catch (caughtError) {
      setError(
        caughtError instanceof ApiError
          ? caughtError.message
          : 'Could not delete the ticket right now.',
      );
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Ticket Detail</p>
          <h4 className="mt-2 text-xl font-semibold text-slate-900">{ticket.title}</h4>
        </div>
        <span className={`rounded-md px-2 py-1 text-xs font-semibold ${priorityClasses[ticket.priority]}`}>
          {ticket.priority}
        </span>
      </div>

      <div className="grid gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
        <p>
          <span className="font-medium text-slate-900">Status:</span> {statusLabels[ticket.status]}
        </p>
        <p>
          <span className="font-medium text-slate-900">Created:</span>{' '}
          {new Date(ticket.createdAt).toLocaleString()}
        </p>
        <p>
          <span className="font-medium text-slate-900">Updated:</span>{' '}
          {new Date(ticket.updatedAt).toLocaleString()}
        </p>
        <p>
          <span className="font-medium text-slate-900">Comments:</span> {ticket.commentCount}
        </p>
      </div>

      <p className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
        {ticket.description || 'No description available for this ticket yet.'}
      </p>

      <TicketComments ticketId={ticket.id} onCommentCountChange={onCommentCountChange} />

      {error ? (
        <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {error}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => {
            setError(null);
            setIsEditing((value) => !value);
          }}
          className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:text-slate-900"
        >
          {isEditing ? 'Close Editor' : 'Edit Ticket'}
        </button>
        <button
          type="button"
          onClick={handleDelete}
          disabled={isDeleting}
          className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-rose-700 disabled:cursor-wait disabled:bg-rose-300"
        >
          {isDeleting ? 'Deleting...' : 'Delete Ticket'}
        </button>
      </div>

      {isEditing ? (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="mb-3 text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
            Edit Ticket
          </p>
          <TicketForm
            mode="edit"
            initialTicket={ticket}
            onCancel={() => setIsEditing(false)}
            onSubmit={async (payload) => {
              await onUpdate(ticket.id, payload);
              setIsEditing(false);
              setError(null);
            }}
          />
        </div>
      ) : null}
    </div>
  );
}
