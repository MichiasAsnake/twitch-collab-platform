import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Message, TwitchUser } from '../types';
import { useStore } from '../store';

interface MessageListProps {
  messages: Message[];
}

interface MessageGroupProps {
  messages: Message[];
  user: TwitchUser;
  isOwn: boolean;
}

// New component for grouped messages
function MessageGroup({ messages, user, isOwn }: MessageGroupProps) {
  const formatMessageDate = (dateString: string) => {
    try {
      // Ensure we have a valid date string
      if (!dateString) return 'Invalid date';
      
      const date = new Date(dateString);
      // Check if the date is valid
      if (isNaN(date.getTime())) {
        return 'Invalid date';
      }
      return formatDistanceToNow(date, { addSuffix: true });
    } catch (error) {
      console.error('Error formatting date:', error, dateString);
      return 'Invalid date';
    }
  };

  return (
    <div className={`flex gap-3 ${isOwn ? 'flex-row-reverse' : ''}`}>
      <img
        src={user.profileImageUrl}
        alt={user.displayName}
        className="w-8 h-8 rounded-full flex-shrink-0 self-start mt-1"
      />
      <div className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'} gap-2`}>
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {user.displayName}
        </span>
        {messages.map((message) => (
          <div key={message.id} className="flex flex-col gap-1">
            <div
              className={`px-4 py-2 rounded-lg max-w-[300px] ${
                isOwn
                  ? 'bg-[#9146FF] text-white rounded-tr-none'
                  : 'bg-gray-100 dark:bg-gray-700 dark:text-white rounded-tl-none'
              }`}
            >
              <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
            </div>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {formatMessageDate(message.createdAt)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function MessageList({ messages = [] }: MessageListProps) {
  console.log('Messages received:', messages);

  const user = useStore((state) => state.user);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Group messages by sender
  const groupedMessages = React.useMemo(() => {
    if (!Array.isArray(messages) || messages.length === 0) {
      return [];
    }

    const groups: { [key: string]: Message[] } = {};
    
    messages.forEach((message) => {
      if (!message?.fromUser?.id) {
        console.warn('Invalid message format:', message);
        return;
      }

      const senderId = message.fromUser.id;
      if (!groups[senderId]) {
        groups[senderId] = [];
      }
      groups[senderId].push(message);
    });

    return Object.entries(groups).map(([senderId, messages]) => ({
      user: messages[0].fromUser,
      messages: messages.sort((a, b) => 
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      )
    }));
  }, [messages]);

  if (!messages?.length) {
    return <div className="text-center text-gray-500">No messages yet</div>;
  }

  return (
    <div className="space-y-6 max-h-[500px] overflow-y-auto p-4">
      {groupedMessages.map(({ user: messageUser, messages }) => (
        <MessageGroup
          key={messageUser.id}
          messages={messages}
          user={messageUser}
          isOwn={messageUser.id === user?.id}
        />
      ))}
      <div ref={messagesEndRef} />
    </div>
  );
}