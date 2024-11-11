import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { useStore } from '../store';

interface InboxModalProps {
  onClose: () => void;
}

export function InboxModal({ onClose }: InboxModalProps) {
  const user = useStore((state) => state.user);
  const messages = useStore((state) => state.messages);
  const markMessageAsRead = useStore((state) => state.markMessageAsRead);

  const userMessages = messages.filter(
    (msg) => msg.toUser.id === user?.id || msg.fromUser.id === user?.id
  ).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  React.useEffect(() => {
    // Mark all messages as read when opening inbox
    userMessages.forEach((msg) => {
      if (!msg.read && msg.toUser.id === user?.id) {
        markMessageAsRead(msg.id);
      }
    });
  }, [userMessages, user, markMessageAsRead]);

  if (!user) return null;

  return (
    <div className="space-y-4 max-h-[60vh] overflow-y-auto">
      {userMessages.length === 0 ? (
        <p className="text-center text-gray-500 dark:text-gray-400 py-8">
          No messages yet
        </p>
      ) : (
        userMessages.map((message) => {
          const isReceived = message.toUser.id === user.id;

          return (
            <div
              key={message.id}
              className={`flex gap-3 ${isReceived ? '' : 'flex-row-reverse'}`}
            >
              <img
                src={isReceived ? message.fromUser.profileImageUrl : message.toUser.profileImageUrl}
                alt={isReceived ? message.fromUser.displayName : message.toUser.displayName}
                className="w-8 h-8 rounded-full flex-shrink-0"
              />
              <div
                className={`flex flex-col ${
                  isReceived ? 'items-start' : 'items-end'
                }`}
              >
                <div
                  className={`px-4 py-2 rounded-lg ${
                    isReceived
                      ? 'bg-gray-100 dark:bg-gray-700'
                      : 'bg-purple-600 text-white'
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
        })
      )}
    </div>
  );
}