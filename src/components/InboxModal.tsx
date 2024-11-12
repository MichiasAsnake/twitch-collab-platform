import React, { useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { useStore } from '../store';
import { User, Message } from '../types';
import { fetchUserMessages, sendMessage } from '../lib/api';

interface InboxModalProps {
  onClose: () => void;
}

const formatMessageDate = (dateString: string) => {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return 'Invalid date';
    }
    return formatDistanceToNow(date, { addSuffix: true });
  } catch (error) {
    console.error('Date formatting error:', error);
    return 'Invalid date';
  }
};

export function InboxModal({ onClose }: InboxModalProps) {
  const currentUser = useStore(state => state.user);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const loadMessages = async () => {
      if (!currentUser) return;
      
      setIsLoading(true);
      try {
        const data = await fetchUserMessages(currentUser.id);
        setMessages(data);
      } catch (error) {
        console.error('Failed to fetch messages:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadMessages();
  }, [currentUser]);

  const handleSendReply = async () => {
    if (!selectedUserId || !replyText.trim()) return;

    const conversation = conversations[selectedUserId];
    const requestId = conversation?.messages[0]?.request_id;
    
    try {
      const newMessage = await sendMessage({
        content: replyText,
        toUserId: selectedUserId,
        requestId: requestId
      });

      setMessages(prev => [newMessage, ...prev]);
      setReplyText('');
    } catch (error) {
      console.error('Failed to send reply:', error);
    }
  };

  // Group messages by conversation
  const conversations = React.useMemo(() => {
    if (!currentUser) return {};

    const groups = messages.reduce((acc, message) => {
      const otherUser = message.fromUser.id === currentUser.id 
        ? message.toUser 
        : message.fromUser;
      
      if (!acc[otherUser.id]) {
        acc[otherUser.id] = {
          user: otherUser,
          messages: [],
          latestMessage: message
        };
      }
      acc[otherUser.id].messages.unshift(message);
      
      if (!acc[otherUser.id].latestMessage || 
          new Date(message.createdAt) > new Date(acc[otherUser.id].latestMessage.createdAt)) {
        acc[otherUser.id].latestMessage = message;
      }
      
      return acc;
    }, {} as Record<string, { user: User; messages: Message[]; latestMessage: Message }>);

    return groups;
  }, [messages, currentUser]);

  return (
    <div className="flex flex-col h-[60vh] bg-white dark:bg-gray-800 rounded-lg">
      <div className="p-4 border-b dark:border-gray-700">
        <h2 className="text-lg font-semibold">Messages</h2>
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
        >
          ✕
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" />
          </div>
        ) : selectedUserId ? (
          // Conversation view
          <div className="space-y-4 p-4">
            {conversations[selectedUserId]?.messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${
                  message.fromUser.id === currentUser?.id ? 'flex-row-reverse' : ''
                }`}
              >
                <img
                  src={message.fromUser.profileImageUrl}
                  alt={message.fromUser.displayName}
                  className="w-8 h-8 rounded-full flex-shrink-0"
                />
                <div
                  className={`flex flex-col ${
                    message.fromUser.id === currentUser?.id ? 'items-end' : 'items-start'
                  }`}
                >
                  <div
                    className={`px-4 py-2 rounded-lg ${
                      message.fromUser.id === currentUser?.id
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-700'
                    }`}
                  >
                    <p className="text-sm">{message.content}</p>
                  </div>
                  <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {formatMessageDate(message.createdAt)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          // Conversation list
          <div className="space-y-2 p-4">
            {Object.values(conversations).map(({ user, messages }) => (
              <div
                key={user.id}
                onClick={() => setSelectedUserId(user.id)}
                className="flex items-center gap-3 p-3 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer rounded-lg"
              >
                <img
                  src={user.profileImageUrl}
                  alt={user.displayName}
                  className="w-10 h-10 rounded-full"
                />
                <div className="flex-1">
                  <h3 className="font-medium">{user.displayName}</h3>
                  <p className="text-sm text-gray-500 truncate">
                    {messages[0]?.content}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedUserId && (
        <div className="p-4 border-t dark:border-gray-700">
          <div className="flex gap-2">
            <input
              type="text"
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendReply()}
              className="flex-1 rounded-lg border p-2 dark:bg-gray-700 dark:border-gray-600"
              placeholder="Type your message..."
            />
            <button
              onClick={handleSendReply}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              Send
            </button>
          </div>
        </div>
      )}
    </div>
  );
}