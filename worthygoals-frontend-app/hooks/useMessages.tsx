import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Socket } from "socket.io-client";
import type { ApiMessage } from "@/models";
import { messagesService } from "@/services/messages.service";
import {
  connectMessagesSocket,
  disconnectMessagesSocket,
  emitSendMessage,
} from "@/helpers/messagesSocket";

function upsertById(items: ApiMessage[], next: ApiMessage): ApiMessage[] {
  const idx = items.findIndex((m) => m.id === next.id);
  if (idx === -1) return [...items, next];
  const copy = items.slice();
  copy[idx] = next;
  return copy;
}

function makeClientMessageId() {
  return `cm_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

export function useMessages(conversationId?: string) {
  const [messages, setMessages] = useState<ApiMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const socketRef = useRef<Socket | null>(null);
  const pendingSendRef = useRef(
    new Map<
      string,
      {
        resolve: (msg: ApiMessage) => void;
        reject: (err: Error) => void;
        timeoutId: any;
      }
    >()
  );

  const canRun = useMemo(() => Boolean(conversationId), [conversationId]);

  const refresh = useCallback(async () => {
    if (!conversationId) return;

    setLoading(true);
    setError(null);
    try {
      const data = await messagesService.list({ conversationId });
      setMessages(data);
    } catch (e: any) {
      setError(e?.message ?? "Failed to load messages");
    } finally {
      setLoading(false);
    }
  }, [conversationId]);

  const sendText = useCallback(
    async (text: string, clientMessageId?: string) => {
      if (!conversationId) throw new Error("conversationId is required");

      const socket = socketRef.current;
      const cmid = clientMessageId ?? makeClientMessageId();

      // Preferred path: WebSocket send + receive via messageCreated.
      if (socket?.connected) {
        return await new Promise<ApiMessage>((resolve, reject) => {
          const timeoutId = setTimeout(() => {
            pendingSendRef.current.delete(cmid);
            reject(new Error("Timed out sending message"));
          }, 15000);

          pendingSendRef.current.set(cmid, { resolve, reject, timeoutId });

          emitSendMessage(
            socket,
            { conversationId, text, clientMessageId: cmid },
            (ack: any) => {
              // We resolve on the messageCreated event (so UI stays consistent).
              if (ack && ack.ok === false) {
                const pending = pendingSendRef.current.get(cmid);
                if (pending) {
                  clearTimeout(pending.timeoutId);
                  pendingSendRef.current.delete(cmid);
                }
                reject(new Error(ack?.error ?? "Failed to send message"));
              }
            }
          );
        });
      }

      // Fallback: REST still works if realtime is down.
      const saved = await messagesService.sendTextMessage({
        conversationId,
        text,
        clientMessageId: cmid,
      });
      setMessages((prev) => upsertById(prev, saved));
      return saved;
    },
    [conversationId]
  );

  useEffect(() => {
    if (!canRun) return;
    refresh();
  }, [canRun, refresh]);

  useEffect(() => {
    let cancelled = false;

    async function connect() {
      if (!conversationId) return;

      try {
        const socket = await connectMessagesSocket({
          conversationId,
          handlers: {
            onMessageCreated: (msg) => {
              if (cancelled) return;
              if (!msg || msg.conversationId !== conversationId) return;
              setMessages((prev) => upsertById(prev, msg));

              // Resolve pending send if this is the echoed user message.
              if (msg.role === "user" && msg.clientMessageId) {
                const pending = pendingSendRef.current.get(msg.clientMessageId);
                if (pending) {
                  clearTimeout(pending.timeoutId);
                  pendingSendRef.current.delete(msg.clientMessageId);
                  pending.resolve(msg);
                }
              }
            },
            onConnectError: (err) => {
              if (cancelled) return;
              // Don’t hard-fail the UI; REST still works.
              setError(err?.message ?? "Realtime connection failed");
            },
          },
        });

        if (cancelled) {
          disconnectMessagesSocket(socket, conversationId);
          return;
        }
        socketRef.current = socket;
      } catch (err: any) {
        if (cancelled) return;
        setError(err?.message ?? "Realtime connection failed");
      }
    }

    if (conversationId) {
      connect();
    }

    return () => {
      cancelled = true;

      // Reject any pending sends for this conversation.
      for (const [key, pending] of pendingSendRef.current.entries()) {
        clearTimeout(pending.timeoutId);
        pending.reject(new Error("Socket disconnected"));
        pendingSendRef.current.delete(key);
      }

      const socket = socketRef.current;
      socketRef.current = null;

      if (socket && conversationId) {
        disconnectMessagesSocket(socket, conversationId);
      }
    };
  }, [conversationId]);

  return {
    messages,
    loading,
    error,
    refresh,
    sendText,
  };
}
