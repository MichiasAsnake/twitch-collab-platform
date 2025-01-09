import React, { useState, useEffect } from 'react';
import { useStore } from '../store';
import { User, Message } from '../types';
import { fetchUserMessages, sendMessage } from '../lib/api';
import { socket } from '../lib/socket';
import { formatMessageDate } from '../utils/dateFormat';

interface InboxModalProps {
  onClose: () => void;
}

export function InboxModal({ onClose }: InboxModalProps) {
  const currentUser = useStore(state => state.user);
  const setMessagesRead = useStore(state => state.setMessagesRead);
  const messages = useStore(state => state.messages);
  const addMessage = useStore(state => state.addMessage);
  const setMessages = useStore(state => state.setMessages);
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

  useEffect(() => {
    if (!currentUser) return;

    const handleNewMessage = (message: Message) => {
      if (!messages.some(m => m.id === message.id)) {
        addMessage({
          ...message,
          read: message.fromUser.id === currentUser.id || 
                (selectedUserId === message.fromUser.id)
        });
      }

      if (selectedUserId === message.fromUser.id || selectedUserId === message.toUser.id) {
        setMessagesRead(selectedUserId);
      }
    };

    socket.on('new_message', handleNewMessage);

    return () => {
      socket.off('new_message', handleNewMessage);
    };
  }, [currentUser, selectedUserId, setMessagesRead, messages, addMessage]);

  useEffect(() => {
    if (selectedUserId && currentUser) {
      setMessagesRead(selectedUserId);
    }
  }, [selectedUserId, currentUser, setMessagesRead]);

  const handleSendReply = async () => {
    if (!selectedUserId || !replyText.trim() || !currentUser) return;

    const conversation = conversations[selectedUserId];
    const content = replyText.trim();
    setReplyText(''); // Clear input immediately
    
    try {
      const requestId = conversation?.messages[0]?.requestId || `inbox-${selectedUserId}`;
      await sendMessage({
        content,
        toUserId: selectedUserId,
        requestId,
        fromUserId: currentUser.id,
        fromUser: currentUser
      });
      // Don't manually add message - let socket handle it
    } catch (error) {
      console.error('Failed to send reply:', error);
      setReplyText(content); // Restore on failure
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

      // Ensure we're passing the complete message object including createdAt
      acc[otherUser.id].messages.unshift({
        ...message,
        createdAt: message.createdAt // Make sure this is explicitly included
      });
      
      // Compare dates for latest message
      const messageDate = new Date(message.createdAt).getTime();
      const latestDate = acc[otherUser.id].latestMessage 
        ? new Date(acc[otherUser.id].latestMessage.createdAt).getTime()
        : 0;
      
      if (!acc[otherUser.id].latestMessage || messageDate > latestDate) {
        acc[otherUser.id].latestMessage = {
          ...message,
          createdAt: message.createdAt
        };
      }
      
      return acc;
    }, {} as Record<string, { user: User; messages: Message[]; latestMessage: Message }>);

    return groups;
  }, [messages, currentUser]);

  return (
    <div className="flex flex-col bg-white dark:bg-gray-800 rounded-lg h-[400px]">
        {selectedUserId ? (
          <button
            onClick={() => setSelectedUserId(null)}
            className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span>Back</span>
          </button>
        ) : (
          <h2 className="text-lg font-medium text-gray-900 dark:text-white"></h2>
        )}
       

      <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent hover:scrollbar-thumb-gray-400 dark:hover:scrollbar-thumb-gray-500">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" />
          </div>
        ) : selectedUserId ? (
          // Conversation view
          <div className="space-y-4 p-4">
            {conversations[selectedUserId]?.messages.length > 0 ? (
              conversations[selectedUserId].messages.map((message) => (
                <div
                  key={`${message.id}-${message.createdAt}`}
                  className={`flex gap-2 mb-3 ${
                    message.fromUser.id === currentUser?.id ? 'flex-row-reverse' : ''
                  }`}
                >
                  <img
                    src={message.fromUser.profileImageUrl}
                    alt={message.fromUser.displayName}
                    className="w-6 h-6 rounded-full flex-shrink-0 mt-1"
                  />
                  <div
                    className={`flex flex-col ${
                      message.fromUser.id === currentUser?.id ? 'items-end' : 'items-start'
                    } max-w-[75%]`}
                  >
                    <div
                      className={`px-3 py-1.5 rounded-2xl ${
                        message.fromUser.id === currentUser?.id
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-100 dark:bg-gray-700'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {formatMessageDate(message.createdAt)}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center text-gray-500 dark:text-gray-400">
                No new messages
              </div>
            )}
          </div>
        ) : (
          // Conversation list
          <div className="space-y-2 p-4">
            {Object.values(conversations).length > 0 ? (
              Object.values(conversations).map(({ user, messages }) => (
                <div
                  key={user.id}
                  onClick={() => setSelectedUserId(user.id)}
                  className="flex items-center gap-3 p-3 bg-gray-50/50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-600/50 cursor-pointer rounded-lg"
                >
                  <img
                    src={user.profileImageUrl}
                    alt={user.displayName}
                    className="w-10 h-10 rounded-full"
                  />
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900 dark:text-gray-100">
                      {user.displayName}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300 truncate">
                      {messages[0]?.content}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center text-gray-500 dark:text-gray-400">
                No new messages
              </div>
            )}
          </div>
        )}
      </div>

      {selectedUserId && (
        <div className="p-4 border-t dark:border-gray-700 bg-white dark:bg-gray-800">
          <div className="flex gap-2">
            <input
              type="text"
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendReply()}
              className="flex-1 rounded-lg border p-2 dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
              placeholder="Type your message..."
            />
            <button
              onClick={handleSendReply}
              disabled={!replyText.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Send
            </button>
          </div>
        </div>
      )}
    </div>
  );
}