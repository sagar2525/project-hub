'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  type FormEvent,
  type KeyboardEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  API_BASE_URL,
  ApiError,
  clearChatHistory,
  getChatHistory,
  sendChatMessage,
  type ChatSourceReference,
} from '@/lib/api';

const SESSION_STORAGE_KEY = 'projecthub.chat.sessionId';

interface UiMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources: ChatSourceReference[];
}

const suggestedQuestions = [
  'What are the open high-priority tickets?',
  'Summarize recent activity across all projects.',
  'Which project has the most open tickets?',
];

function createSessionId(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `session-${Date.now()}`;
}

function parseSources(value: unknown): ChatSourceReference[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((item) => {
    if (!item || typeof item !== 'object') {
      return [];
    }

    const source = item as Record<string, unknown>;
    if (
      typeof source.sourceType !== 'string' ||
      typeof source.sourceId !== 'string' ||
      typeof source.snippet !== 'string' ||
      typeof source.distance !== 'number'
    ) {
      return [];
    }

    return [
      {
        sourceType: source.sourceType,
        sourceId: source.sourceId,
        snippet: source.snippet,
        distance: source.distance,
        metadata:
          source.metadata && typeof source.metadata === 'object'
            ? (source.metadata as Record<string, unknown>)
            : null,
      },
    ];
  });
}

function sourceLabel(source: ChatSourceReference): string {
  const projectName =
    source.metadata && typeof source.metadata.projectName === 'string'
      ? source.metadata.projectName
      : null;
  const ticketTitle =
    source.metadata && typeof source.metadata.ticketTitle === 'string'
      ? source.metadata.ticketTitle
      : null;

  if (ticketTitle && projectName) {
    return `Ticket: ${ticketTitle} (${projectName})`;
  }
  if (ticketTitle) {
    return `Ticket: ${ticketTitle}`;
  }
  if (projectName) {
    return `Project: ${projectName}`;
  }

  return `${source.sourceType} ${source.sourceId}`;
}

function sourceHref(source: ChatSourceReference): string | null {
  const projectId =
    source.metadata && typeof source.metadata.projectId === 'string'
      ? source.metadata.projectId
      : null;
  const ticketId =
    source.metadata && typeof source.metadata.ticketId === 'string'
      ? source.metadata.ticketId
      : null;

  if (projectId && ticketId) {
    return `/projects/${projectId}?ticketId=${ticketId}`;
  }
  if (projectId) {
    return `/projects/${projectId}`;
  }

  return null;
}

export default function ChatPage() {
  const searchParams = useSearchParams();
  const prefillPrompt = searchParams.get('prompt')?.trim() ?? '';
  const endRef = useRef<HTMLDivElement | null>(null);
  const [sessionId, setSessionId] = useState<string>('');
  const [messages, setMessages] = useState<UiMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const storedSessionId = localStorage.getItem(SESSION_STORAGE_KEY);
    const nextSessionId = storedSessionId || createSessionId();
    localStorage.setItem(SESSION_STORAGE_KEY, nextSessionId);
    setSessionId(nextSessionId);
  }, []);

  useEffect(() => {
    if (!sessionId) {
      return;
    }

    let isActive = true;
    setIsLoadingHistory(true);
    setError(null);

    getChatHistory(sessionId)
      .then((history) => {
        if (!isActive) {
          return;
        }
        setMessages(
          history
            .filter((message) => message.role === 'user' || message.role === 'assistant')
            .map((message) => ({
              id: message.id,
              role: message.role as 'user' | 'assistant',
              content: message.content,
              sources: parseSources(message.sources),
            })),
        );
      })
      .catch((caughtError) => {
        if (!isActive) {
          return;
        }
        setError(
          caughtError instanceof ApiError
            ? caughtError.message
            : 'Could not load chat history.',
        );
      })
      .finally(() => {
        if (isActive) {
          setIsLoadingHistory(false);
        }
      });

    return () => {
      isActive = false;
    };
  }, [sessionId]);

  useEffect(() => {
    if (prefillPrompt && !input) {
      setInput(prefillPrompt);
    }
  }, [prefillPrompt, input]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isStreaming]);

  const canSend = useMemo(
    () => Boolean(sessionId && input.trim() && !isStreaming),
    [sessionId, input, isStreaming],
  );

  async function streamChat(
    message: string,
    activeSessionId: string,
    assistantMessageId: string,
  ): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/chat/stream`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        sessionId: activeSessionId,
      }),
    });

    if (!response.ok || !response.body) {
      throw new Error('Streaming endpoint is unavailable.');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    const applyToken = (token: string) => {
      setMessages((current) =>
        current.map((item) =>
          item.id === assistantMessageId
            ? {
                ...item,
                content: `${item.content}${token}`,
              }
            : item,
        ),
      );
    };

    const applyDone = (sources: ChatSourceReference[]) => {
      setMessages((current) =>
        current.map((item) =>
          item.id === assistantMessageId
            ? {
                ...item,
                sources,
              }
            : item,
        ),
      );
    };

    while (true) {
      const { value, done } = await reader.read();
      if (done) {
        break;
      }

      buffer += decoder.decode(value, { stream: true });
      let separatorIndex = buffer.indexOf('\n\n');

      while (separatorIndex !== -1) {
        const eventPayload = buffer.slice(0, separatorIndex).trim();
        buffer = buffer.slice(separatorIndex + 2);

        const dataLine = eventPayload
          .split('\n')
          .find((line) => line.startsWith('data:'));

        if (dataLine) {
          const jsonPayload = dataLine.slice(5).trim();
          if (jsonPayload) {
            const parsed = JSON.parse(jsonPayload) as {
              token?: string;
              done?: boolean;
              error?: string;
              sources?: unknown;
            };

            if (parsed.token) {
              applyToken(parsed.token);
            }

            if (parsed.error) {
              throw new Error(parsed.error);
            }

            if (parsed.done) {
              applyDone(parseSources(parsed.sources));
            }
          }
        }

        separatorIndex = buffer.indexOf('\n\n');
      }
    }
  }

  async function submitMessage(): Promise<void> {
    const message = input.trim();
    if (!message || !sessionId || isStreaming) {
      return;
    }

    setError(null);
    setInput('');
    setIsStreaming(true);

    const userMessageId = `user-${Date.now()}`;
    const assistantMessageId = `assistant-${Date.now()}`;

    setMessages((current) => [
      ...current,
      {
        id: userMessageId,
        role: 'user',
        content: message,
        sources: [],
      },
      {
        id: assistantMessageId,
        role: 'assistant',
        content: '',
        sources: [],
      },
    ]);

    try {
      await streamChat(message, sessionId, assistantMessageId);
    } catch {
      try {
        const fallback = await sendChatMessage(message, sessionId);
        setMessages((current) =>
          current.map((item) =>
            item.id === assistantMessageId
              ? {
                  ...item,
                  content: fallback.response,
                  sources: fallback.sources,
                }
              : item,
          ),
        );
      } catch (caughtError) {
        setError(
          caughtError instanceof ApiError
            ? caughtError.message
            : 'Could not get a chat response.',
        );
        setMessages((current) =>
          current.map((item) =>
            item.id === assistantMessageId
              ? { ...item, content: 'Failed to generate a response.' }
              : item,
          ),
        );
      }
    } finally {
      setIsStreaming(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await submitMessage();
  }

  async function handleNewConversation() {
    const nextSessionId = createSessionId();
    localStorage.setItem(SESSION_STORAGE_KEY, nextSessionId);
    setSessionId(nextSessionId);
    setMessages([]);
    setInput('');
    setError(null);
    setIsLoadingHistory(false);
  }

  async function handleClearCurrentConversation() {
    if (!sessionId || isStreaming) {
      return;
    }

    setError(null);
    try {
      await clearChatHistory(sessionId);
      setMessages([]);
    } catch (caughtError) {
      setError(
        caughtError instanceof ApiError
          ? caughtError.message
          : 'Could not clear this conversation.',
      );
    }
  }

  function onInputKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      if (canSend) {
        void submitMessage();
      }
    }
  }

  return (
    <section className="flex min-h-[75vh] flex-col rounded-xl border border-slate-200 bg-white p-4 shadow-sm md:p-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Day 13 Chat UI</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-900">AI Project Assistant</h2>
          <p className="mt-1 text-sm text-slate-600">Session: {sessionId || 'initializing...'}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void handleNewConversation()}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 transition hover:border-slate-400 hover:text-slate-900"
          >
            New Conversation
          </button>
          <button
            type="button"
            disabled={!sessionId || isStreaming}
            onClick={() => void handleClearCurrentConversation()}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 transition hover:border-slate-400 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Clear Current
          </button>
        </div>
      </header>

      <div className="mt-5 flex-1 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50 p-3 md:p-4">
        {isLoadingHistory ? (
          <p className="text-sm text-slate-500">Loading chat history...</p>
        ) : messages.length === 0 ? (
          <div className="space-y-3">
            <p className="text-sm text-slate-600">
              Ask about projects, tickets, and comments. Suggested starters:
            </p>
            <div className="flex flex-wrap gap-2">
              {suggestedQuestions.map((question) => (
                <button
                  key={question}
                  type="button"
                  onClick={() => setInput(question)}
                  className="rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-700 transition hover:border-slate-400 hover:text-slate-900"
                >
                  {question}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((message) => (
              <article
                key={message.id}
                className={`rounded-xl border p-3 ${
                  message.role === 'user'
                    ? 'border-sky-200 bg-sky-50'
                    : 'border-slate-200 bg-white'
                }`}
              >
                <p className="text-xs uppercase tracking-[0.16em] text-slate-500">
                  {message.role === 'user' ? 'You' : 'Assistant'}
                </p>
                <p className="mt-2 whitespace-pre-wrap text-sm text-slate-800">
                  {message.content || (isStreaming ? 'Thinking...' : '')}
                </p>
                {message.role === 'assistant' && message.sources.length > 0 ? (
                  <div className="mt-3 border-t border-slate-200 pt-3">
                    <p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-500">
                      Sources
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {message.sources.map((source, index) => {
                        const href = sourceHref(source);
                        const label = sourceLabel(source);
                        const key = `${source.sourceType}-${source.sourceId}-${index}`;

                        return href ? (
                          <Link
                            key={key}
                            href={href}
                            className="rounded-md border border-slate-300 bg-slate-50 px-2 py-1 text-xs text-slate-700 transition hover:border-slate-400 hover:text-slate-900"
                          >
                            {label}
                          </Link>
                        ) : (
                          <span
                            key={key}
                            className="rounded-md border border-slate-300 bg-slate-50 px-2 py-1 text-xs text-slate-700"
                          >
                            {label}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                ) : null}
              </article>
            ))}
          </div>
        )}
        <div ref={endRef} />
      </div>

      {error ? (
        <p className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {error}
        </p>
      ) : null}

      <form onSubmit={handleSubmit} className="mt-4">
        <label className="block">
          <span className="mb-1 block text-xs uppercase tracking-[0.16em] text-slate-500">
            Message
          </span>
          <textarea
            rows={3}
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={onInputKeyDown}
            placeholder="Ask about project status, ticket updates, or recent comments..."
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-500"
          />
        </label>
        <div className="mt-3 flex items-center justify-between gap-3">
          <p className="text-xs text-slate-500">Enter to send, Shift+Enter for newline.</p>
          <button
            type="submit"
            disabled={!canSend}
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            {isStreaming ? 'Streaming...' : 'Send'}
          </button>
        </div>
      </form>
    </section>
  );
}
