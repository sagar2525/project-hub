'use client';

import { useEffect, useState } from 'react';
import {
  ApiError,
  createComment,
  deleteComment,
  getCommentsByTicket,
  type Comment,
  updateComment,
} from '@/lib/api';

interface TicketCommentsProps {
  ticketId: string;
  onCommentCountChange: (nextCount: number) => void;
}

export function TicketComments({
  ticketId,
  onCommentCountChange,
}: TicketCommentsProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [author, setAuthor] = useState('');
  const [content, setContent] = useState('');
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingAuthor, setEditingAuthor] = useState('');
  const [editingContent, setEditingContent] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let active = true;
    setIsLoading(true);
    setError(null);
    setEditingCommentId(null);

    getCommentsByTicket(ticketId)
      .then((nextComments) => {
        if (!active) {
          return;
        }

        setComments(nextComments);
        onCommentCountChange(nextComments.length);
      })
      .catch((caughtError) => {
        if (!active) {
          return;
        }

        setError(
          caughtError instanceof ApiError
            ? caughtError.message
            : 'Could not load comments right now.',
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
  }, [ticketId]);

  async function handleCreateComment(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedAuthor = author.trim();
    const normalizedContent = content.trim();

    if (normalizedAuthor.length < 2) {
      setError('Author name must be at least 2 characters.');
      return;
    }

    if (normalizedContent.length < 1) {
      setError('Comment content cannot be empty.');
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      const createdComment = await createComment(ticketId, {
        author: normalizedAuthor,
        content: normalizedContent,
      });

      setComments((current) => {
        const nextComments = [createdComment, ...current];
        onCommentCountChange(nextComments.length);
        return nextComments;
      });
      setAuthor('');
      setContent('');
    } catch (caughtError) {
      setError(
        caughtError instanceof ApiError
          ? caughtError.message
          : 'Could not create the comment right now.',
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleSaveComment(commentId: string) {
    const normalizedAuthor = editingAuthor.trim();
    const normalizedContent = editingContent.trim();

    if (normalizedAuthor.length < 2) {
      setError('Author name must be at least 2 characters.');
      return;
    }

    if (normalizedContent.length < 1) {
      setError('Comment content cannot be empty.');
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      const updated = await updateComment(commentId, {
        author: normalizedAuthor,
        content: normalizedContent,
      });

      setComments((current) =>
        current.map((comment) => (comment.id === commentId ? updated : comment)),
      );
      setEditingCommentId(null);
    } catch (caughtError) {
      setError(
        caughtError instanceof ApiError
          ? caughtError.message
          : 'Could not update the comment right now.',
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDeleteComment(commentId: string) {
    setError(null);

    try {
      await deleteComment(commentId);
      setComments((current) => {
        const nextComments = current.filter((comment) => comment.id !== commentId);
        onCommentCountChange(nextComments.length);
        return nextComments;
      });
      if (editingCommentId === commentId) {
        setEditingCommentId(null);
      }
    } catch (caughtError) {
      setError(
        caughtError instanceof ApiError
          ? caughtError.message
          : 'Could not delete the comment right now.',
      );
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Day 9 Comments UI</p>
          <h5 className="mt-1 text-lg font-semibold text-slate-900">Comments</h5>
        </div>
        <span className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-600">
          {comments.length}
        </span>
      </div>

      {error ? (
        <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {error}
        </p>
      ) : null}

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 2 }).map((_, index) => (
            <div key={index} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="h-4 w-28 animate-pulse rounded bg-slate-200" />
              <div className="mt-3 h-4 w-full animate-pulse rounded bg-slate-100" />
              <div className="mt-2 h-4 w-4/5 animate-pulse rounded bg-slate-100" />
            </div>
          ))}
        </div>
      ) : comments.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
          No comments yet. Add the first update below.
        </div>
      ) : (
        <div className="space-y-3">
          {comments.map((comment) => {
            const isEditing = editingCommentId === comment.id;

            return (
              <article
                key={comment.id}
                className="rounded-xl border border-slate-200 bg-slate-50 p-4"
              >
                {isEditing ? (
                  <div className="space-y-3">
                    <input
                      value={editingAuthor}
                      onChange={(event) => setEditingAuthor(event.target.value)}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-500"
                    />
                    <textarea
                      value={editingContent}
                      onChange={(event) => setEditingContent(event.target.value)}
                      rows={3}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-500"
                    />
                    <div className="flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={() => handleSaveComment(comment.id)}
                        disabled={isSubmitting}
                        className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white transition hover:bg-slate-700 disabled:cursor-wait disabled:bg-slate-400"
                      >
                        {isSubmitting ? 'Saving...' : 'Save'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingCommentId(null)}
                        className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:text-slate-900"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{comment.author}</p>
                        <p className="mt-1 text-xs text-slate-500">
                          {new Date(comment.updatedAt).toLocaleString()}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingCommentId(comment.id);
                            setEditingAuthor(comment.author);
                            setEditingContent(comment.content);
                            setError(null);
                          }}
                          className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs font-medium text-slate-700 transition hover:border-slate-400 hover:text-slate-900"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteComment(comment.id)}
                          className="rounded-md bg-rose-600 px-2 py-1 text-xs font-medium text-white transition hover:bg-rose-700"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                    <p className="mt-3 text-sm text-slate-600">{comment.content}</p>
                  </>
                )}
              </article>
            );
          })}
        </div>
      )}

      <form
        onSubmit={handleCreateComment}
        className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
      >
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
          Add Comment
        </p>
        <div className="mt-3 space-y-3">
          <input
            value={author}
            onChange={(event) => setAuthor(event.target.value)}
            placeholder="Your name"
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-500"
          />
          <textarea
            value={content}
            onChange={(event) => setContent(event.target.value)}
            rows={3}
            placeholder="Share an update on this ticket"
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-500"
          />
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700 disabled:cursor-wait disabled:bg-slate-400"
          >
            {isSubmitting ? 'Posting...' : 'Add Comment'}
          </button>
        </div>
      </form>
    </div>
  );
}
