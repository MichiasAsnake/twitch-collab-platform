import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Message } from '../types';
import { useStore } from '../store';

interface MessageListProps {
  messages: Message[];
}

export function MessageList({ messages }: MessageListProps) {
  const user = useStore((state) => state.user);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="space-y-4 max-h-[300px] overflow-y-auto">
      {messages.map((message) => {
        const isOwn = message.from.id === user?.id;

        return (
          <div
            key={message.id}
            className={`flex gap-3 ${isOwn ? 'flex-row-reverse' : ''}`}
          >
            <img
              src={message.from.profileImageUrl}
              alt={message.from.displayName}
              className="w-8 h-8 rounded-full flex-shrink-0"
            />
            <div
              className={`flex flex-col ${
                isOwn ? 'items-end' : 'items-start'
              }`}
            >
              <div
                className={`px-4 py-2 rounded-lg ${
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
  );
}