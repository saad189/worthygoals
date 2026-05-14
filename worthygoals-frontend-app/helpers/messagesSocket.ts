import { io, Socket } from "socket.io-client";
import config from "@/constants/Config";
import Storage from "@/helpers/SecureStorageUtil";
import { ACCESS_TOKEN } from "@/constants";
import type { ApiMessage } from "@/models";

export type MessagesSocketHandlers = {
  onMessageCreated?: (msg: ApiMessage) => void;
  onConnectError?: (err: any) => void;
};

export async function connectMessagesSocket(params: {
  conversationId: string;
  handlers?: MessagesSocketHandlers;
}): Promise<Socket> {
  const token = await Storage.getItem(ACCESS_TOKEN);
  if (!token) {
    throw new Error("Missing access token");
  }

  const socket = io(`${config.apiUrl}/messages`, {
    transports: ["websocket"],
    auth: { token },
  });

  socket.on("connect", () => {
    socket.emit("joinConversation", { conversationId: params.conversationId });
  });

  socket.on("messageCreated", (msg: ApiMessage) => {
    params.handlers?.onMessageCreated?.(msg);
  });

  socket.on("connect_error", (err: any) => {
    params.handlers?.onConnectError?.(err);
  });

  return socket;
}

export function disconnectMessagesSocket(
  socket: Socket,
  conversationId: string
) {
  try {
    socket.emit("leaveConversation", { conversationId });
  } catch {
    // ignore
  }
  socket.disconnect();
}

export function emitSendMessage(
  socket: Socket,
  payload: {
    conversationId: string;
    text: string;
    clientMessageId?: string;
  },
  ack?: (ack: any) => void
) {
  socket.emit("send_message", payload, ack);
}
