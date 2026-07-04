import { useCallback, useRef, useState } from 'react';
import { Client } from '@stomp/stompjs';
import type { Frame } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import api from '../api/axios';

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080/api/v1';
const WS_BASE = API_BASE.replace('/api/v1', '');

export interface Message {
  messageId?: number;
  senderId: number;
  recipientId: number;
  content: string;
  messageStatus?: string;
  createdAt?: string;
}

export interface TypingPayload {
  senderId: number;
}

export const useChat = () => {
  const clientRef = useRef<Client | null>(null);
  const [connected, setConnected] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<number[]>([]);
  const [typingFrom, setTypingFrom] = useState<number | null>(null);

  const connect = useCallback((onMessageCb?: (m: Message) => void) => {
    if (clientRef.current && clientRef.current.connected) return;

    const token = localStorage.getItem('accessToken')
    const client = new Client({
      webSocketFactory: () => new SockJS(`${WS_BASE}/ws`),
      connectHeaders: token ? { Authorization: `Bearer ${token}` } : {},
      reconnectDelay: 4000,
      debug: () => { /* silent */ },
      onConnect: (_frame: Frame) => {
        setConnected(true);


        // subscribe to personal queues
        client.subscribe('/user/queue/messages', (msg) => {
          const payload = JSON.parse(msg.body) as Message;
          setMessages((s) => [...s, payload]);
          onMessageCb?.(payload);
        });

        client.subscribe('/user/queue/typing', (msg) => {
          const payload = JSON.parse(msg.body) as TypingPayload;
          setTypingFrom(payload.senderId ?? null);
          setTimeout(() => setTypingFrom(null), 3000);
        });

        client.subscribe('/user/queue/read', (msg) => {
          const payload = JSON.parse(msg.body);

          console.log(payload);
        });

        client.subscribe('/topic/presence', (msg) => {
          const payload = JSON.parse(msg.body);
          if (payload.onlineUsers) {
            setOnlineUsers(payload.onlineUsers);
          } else if (payload.userId) {
            setOnlineUsers((prev) => Array.from(new Set([...prev, payload.userId])));
          }
        });
      },
      onStompError: (frame) => {
        console.error('STOMP error', frame);
      },
      onDisconnect: () => {
        setConnected(false);
      }
    });

    client.activate();
    clientRef.current = client;
  }, []);

  const disconnect = useCallback(() => {
    clientRef.current?.deactivate();
    clientRef.current = null;
    setConnected(false);
  }, []);

  const sendMessage = useCallback((recipientId: number, content: string) => {
    if (!clientRef.current || !clientRef.current.connected) throw new Error('Not connected');

    const payload = JSON.stringify({ recipientId, content });
    clientRef.current.publish({ destination: '/app/chat.send', body: payload });
  }, []);

  const sendTyping = useCallback((recipientId: number, typing: boolean) => {
    if (!clientRef.current || !clientRef.current.connected) return;
    clientRef.current.publish({ destination: '/app/chat.typing', body: JSON.stringify({ recipientId, typing }) });
  }, []);

  const fetchConversation = useCallback(async (otherUserId: number) => {
    const { data } = await api.get(`/chat/conversation/${otherUserId}`);
    setMessages(data);
    return data;
  }, []);

  return {
    connect,
    disconnect,
    connected,
    messages,
    sendMessage,
    sendTyping,
    fetchConversation,
    onlineUsers,
    typingFrom,
  };
};
