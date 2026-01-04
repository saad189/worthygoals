import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import config from "@/constants/Config";
import Storage from "@/helpers/SecureStorageUtil";
import { ACCESS_TOKEN } from "@/constants";
import type { ApiMessage } from "@/models";
import { messagesService } from "@/services/messages.service";

function upsertById(items: ApiMessage[], next: ApiMessage): ApiMessage[] {
  const idx = items.findIndex((m) => m.id === next.id);
  if (idx === -1) return [...items, next];
  const copy = items.slice();
  copy[idx] = next;
  return copy;
}

export function useMessages(conversationId?: string) {
  const [messages, setMessages] = useState<ApiMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const socketRef = useRef<Socket | null>(null);

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
      const saved = await messagesService.sendTextMessage({
        conversationId,
        text,
        clientMessageId,
      });

      // De-dupe with socket events by id.
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

      const token = await Storage.getItem(ACCESS_TOKEN);
      if (cancelled || !token) return;

      const socket = io(`${config.apiUrl}/messages`, {
        transports: ["websocket"],
        auth: { token },
      });

      socketRef.current = socket;

      socket.on("connect", () => {
        socket.emit("joinConversation", { conversationId });
      });

      socket.on("messageCreated", (msg: ApiMessage) => {
        if (!msg || msg.conversationId !== conversationId) return;
        setMessages((prev) => upsertById(prev, msg));
      });

      socket.on("connect_error", (err: any) => {
        // Don’t hard-fail the UI; REST still works.
        setError(err?.message ?? "Realtime connection failed");
      });
    }

    if (conversationId) {
      connect();
    }

    return () => {
      cancelled = true;
      const socket = socketRef.current;
      socketRef.current = null;

      if (socket && conversationId) {
        try {
          socket.emit("leaveConversation", { conversationId });
        } catch {
          // ignore
        }
        socket.disconnect();
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
