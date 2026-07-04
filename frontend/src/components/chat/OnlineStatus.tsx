import React, { useEffect } from 'react';
import { useChat } from '../../hooks/useChat';

export const OnlineStatus: React.FC = () => {
  const { connect, disconnect, onlineUsers } = useChat();

  useEffect(() => {
    connect();
    return () => disconnect();
  }, [connect, disconnect]);

  return (
    <div>
      <h3 className="font-semibold mb-2">Online Users</h3>
      <ul>
        {onlineUsers.map((u) => (
          <li key={u}>User {u}</li>
        ))}
      </ul>
    </div>
  );
};
