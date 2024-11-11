import React from 'react';
import { CollabRequest } from '../types';
import { useStore } from '../store';
import { useSendMessage, useMessages } from '../hooks/useMessages';
import { MessageList } from './MessageList';

interface MessageModalProps {
  request: CollabRequest;
  onClose: () => void;
}

export function MessageModal({ request, onClose }: MessageModalProps) {
  const [message, setMessage] = React.useState('');
  const user = useStore((state) => state.user);
  const sendMessage = useSendMessage();
  const { data: messages = [], isLoading } = useMessages(request.id);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !message.trim()) return;

    try {
      await sendMessage.mutateAsync({
        content: message.trim(),
        requestId: request.id,
        toUserId: request.user.id,
      });
      setMessage('');
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  if (!user) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-4">
        <img
          src={request.user.profileImageUrl}
          alt={request.user.displayName}
          className="w-10 h-10 rounded-full"
        />
        <div>
          <h4 className="font-medium dark:text-white">{request.user.displayName}</h4>
          <p className="text-sm text-gray-600 dark:text-gray-400">{request.title}</p>
        </div>
      </div>

      {isLoading ? (
        <div className="h-48 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-purple-600 border-t-transparent" />
        </div>
      ) : (
        <MessageList messages={messages} />
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="message" className="sr-only">
            Your Message
          </label>
          <textarea
            id="message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={3}
            className="mt-1 block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:border-[#9146FF] dark:focus:border-[#bf94ff] focus:outline-none focus:ring-1 focus:ring-[#9146FF] dark:focus:ring-[#bf94ff]"
            placeholder="Write your message here..."
            required
          />
        </div>

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            Close
          </button>
          <button
            type="submit"
            className="px-4 py-2 text-sm font-medium text-white bg-[#9146FF] rounded-lg hover:bg-[#7c2cff] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={sendMessage.isLoading || !message.trim()}
          >
            {sendMessage.isLoading ? 'Sending...' : 'Send Message'}
          </button>
        </div>
      </form>
    </div>
  );
}