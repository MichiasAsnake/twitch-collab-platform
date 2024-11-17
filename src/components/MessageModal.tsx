import React, { useState } from 'react';
import { sendMessage } from '../lib/api';
import { useStore } from '../store';

interface MessageModalProps {
  onClose: () => void;
  requestId: string;
  toUserId: string;
}

export function MessageModal({ onClose, requestId, toUserId }: MessageModalProps) {
  const [message, setMessage] = useState('');
  const currentUser = useStore(state => state.user);

  const handleSendMessage = async () => {
    if (!message.trim() || !currentUser) return;
    
    try {
      await sendMessage({
        content: message,
        toUserId,
        requestId,
        fromUserId: currentUser.id,
        fromUser: currentUser
      });
      
      onClose();
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  return (
    <div className="p-4">
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
        placeholder="Type your message..."
        rows={4}
      />
      <div className="mt-4 flex justify-end">
        <button
          onClick={handleSendMessage}
          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
        >
          Send Message
        </button>
      </div>
    </div>
  );
}