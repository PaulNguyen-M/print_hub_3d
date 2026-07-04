import React, { useEffect, useState } from 'react';
import { useChat } from '../../hooks/useChat';

interface Props {
  otherUserId: number;
}

export const ChatBox: React.FC<Props> = ({ otherUserId }) => {
  const { connect, disconnect, connected, messages, sendMessage, sendTyping, fetchConversation, typingFrom } = useChat();
  const [text, setText] = useState('');

  useEffect(() => {
    connect();
    fetchConversation(otherUserId);
    return () => disconnect();
  }, [connect, disconnect, fetchConversation, otherUserId]);

  const handleSend = () => {
    if (!text.trim()) return;
    sendMessage(otherUserId, text.trim());
    setText('');
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setText(e.target.value);
    sendTyping(otherUserId, true);
  };

  return (
    <div className="border rounded p-4 w-full max-w-lg">
      <div className="mb-2">Connection: {connected ? 'Connected' : 'Disconnected'}</div>
      <div className="h-64 overflow-auto border p-2 mb-2">
        {messages.map((m, idx) => (
          <div key={idx} className={`mb-2 ${m.senderId === otherUserId ? 'text-left' : 'text-right'}`}>
            <div className="inline-block bg-gray-100 p-2 rounded">{m.content}</div>
            <div className="text-xs text-gray-500">{m.createdAt}</div>
          </div>
        ))}
      </div>

      {typingFrom === otherUserId && <div className="text-sm text-gray-500 mb-2">Typing...</div>}

      <div className="flex gap-2">
        <input value={text} onChange={handleChange} className="flex-1 px-3 py-2 border rounded" />
        <button onClick={handleSend} className="bg-blue-600 text-white px-4 py-2 rounded">Send</button>
      </div>
    </div>
  );
};
