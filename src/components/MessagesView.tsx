import React from 'react';
import { Message, TwitchUser } from '../types';
import { useStore } from '../store';
import { formatDistanceToNow } from 'date-fns';
import {
  useConversations,
  useConversationMessages,
  useSendConversationMessage,
  useMarkMessagesAsRead,
} from '../hooks/useConversations';

interface ConversationListProps {
  conversations: {
    user: TwitchUser;
    lastMessage: Message;
    unreadCount: number;
  }[];
  selectedUserId: string | null;
  onSelectConversation: (userId: string) => void;
  isLoading: boolean;
}

function ConversationList({ conversations, selectedUserId, onSelectConversation, isLoading }: ConversationListProps) {
  return (
    <div className="border-r border-gray-200 dark:border-gray-700 w-80 overflow-y-auto">
      {conversations.map(({ user, lastMessage, unreadCount }) => (
        <button
          key={user.id}
          onClick={() => onSelectConversation(user.id)}
          className={`w-full p-4 flex items-start gap-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${
            selectedUserId === user.id ? 'bg-gray-100 dark:bg-gray-800' : ''
          }`}
        >
          <img
            src={user.profileImageUrl}
            alt={user.displayName}
            className="w-10 h-10 rounded-full"
          />
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-start">
              <span className="font-medium dark:text-white truncate">
                {user.displayName}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap ml-2">
                {formatDistanceToNow(new Date(lastMessage.createdAt), { addSuffix: true })}
              </span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
              {lastMessage.content}
            </p>
            {unreadCount > 0 && (
              <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-[#9146FF] rounded-full mt-1">
                {unreadCount}
              </span>
            )}
          </div>
        </button>
      ))}
    </div>
  );
}

function ChatView({ conversationId, messages, onSendMessage, isLoading }: {
  conversationId: string;
  messages: Message[];
  onSendMessage: (content: string) => void;
  isLoading: boolean;
}) {
  const [newMessage, setNewMessage] = React.useState('');
  const messagesEndRef = React.useRef<HTMLDivElement>(null);
  const user = useStore((state) => state.user);

  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    onSendMessage(newMessage.trim());
    setNewMessage('');
  };

  return (
    <div className="flex-1 flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => {
          const isOwn = message.fromUser.id === user?.id;
          return (
            <div
              key={message.id}
              className={`flex gap-3 ${isOwn ? 'flex-row-reverse' : ''}`}
            >
              <img
                src={message.fromUser.profileImageUrl}
                alt={message.fromUser.displayName}
                className="w-8 h-8 rounded-full flex-shrink-0"
              />
              <div
                className={`flex flex-col ${
                  isOwn ? 'items-end' : 'items-start'
                }`}
              >
                <div
                  className={`px-4 py-2 rounded-lg max-w-[300px] ${
                    isOwn
                      ? 'bg-[#9146FF] text-white'
                      : 'bg-gray-100 dark:bg-gray-700 dark:text-white'
                  }`}
                >
                  <p className="text-sm">{message.content}</p>
                </div>
                <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {formatDistanceToNow(new Date(message.createdAt), {
                    addSuffix: true,
                  })}
                </span>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="p-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex gap-3">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            className="flex-1 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:border-[#9146FF] dark:focus:border-[#bf94ff] focus:outline-none focus:ring-1 focus:ring-[#9146FF] dark:focus:ring-[#bf94ff]"
            placeholder="Type a message..."
          />
          <button
            type="submit"
            disabled={!newMessage.trim()}
            className="px-4 py-2 text-sm font-medium text-white bg-[#9146FF] rounded-lg hover:bg-[#7c2cff] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
}

export function MessagesView() {
  const [selectedConversationId, setSelectedConversationId] = React.useState<string | null>(null);
  const { data: conversations = [], isLoading: conversationsLoading } = useConversations();
  const { data: messages = [], isLoading: messagesLoading } = useConversationMessages(
    selectedConversationId
  );
  const sendMessage = useSendConversationMessage();
  const markAsRead = useMarkMessagesAsRead();
  const currentUser = useStore((state) => state.user);

  // Mark messages as read when conversation is selected
  React.useEffect(() => {
    if (selectedConversationId) {
      markAsRead.mutate(selectedConversationId);
    }
  }, [selectedConversationId]);

  const handleSendMessage = async (content: string) => {
    if (!selectedConversationId || !currentUser) return;
    
    const conversation = conversations.find(c => c.id === selectedConversationId);
    if (!conversation) return;

    const otherUser = conversation.participants.find(p => p.id !== currentUser.id);
    if (!otherUser) return;

    try {
      // Get the request ID from the conversation or first message
      const requestId = conversation.requestId || messages[0]?.requestId;
      
      if (!requestId) {
        console.error('No request ID found for conversation');
        return;
      }

      await sendMessage.mutateAsync({
        content,
        toUserId: otherUser.id,
        requestId: requestId  // Use the actual request ID
      });
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  if (!currentUser) return null;

  return (
    <div className="flex h-[600px] bg-white dark:bg-gray-900 rounded-lg overflow-hidden">
      <ConversationList
        conversations={conversations}
        selectedUserId={selectedConversationId}
        onSelectConversation={setSelectedConversationId}
        isLoading={conversationsLoading}
      />
      {selectedConversationId ? (
        <ChatView
          conversationId={selectedConversationId}
          messages={messages}
          onSendMessage={handleSendMessage}
          isLoading={messagesLoading}
        />
      ) : (
        <div className="flex-1 flex items-center justify-center text-gray-500">
          Select a conversation to start chatting
        </div>
      )}
    </div>
  );
} 