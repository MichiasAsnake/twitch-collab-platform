import React from 'react';
import { CollabRequest } from '../types';
import { MessageSquare } from 'lucide-react';
import { Modal } from './Modal';
import { MessageModal } from './MessageModal';
import { useStore } from '../store';
import { getTwitchAuthUrl } from '../lib/twitch';

interface RequestCardProps {
  request: CollabRequest;
}

export function RequestCard({ request }: RequestCardProps) {
  const [showMessageModal, setShowMessageModal] = React.useState(false);
  const user = useStore((state) => state.user);

  const handleMessageClick = () => {
    if (!user) {
      window.location.href = getTwitchAuthUrl();
      return;
    }
    setShowMessageModal(true);
  };

  return (
    <>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
        <div className="p-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <img
                src={request.user.profileImageUrl}
                alt={request.user.displayName}
                className="w-12 h-12 rounded-full"
              />
              {request.user.isLive && (
                <div className="absolute -top-1 -right-1">
                  <span className="flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                  </span>
                </div>
              )}
            </div>
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white">
                {request.user.displayName}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {request.user.category}
              </p>
            </div>
          </div>
          <div className="mt-4">
            <h4 className="font-medium text-gray-900 dark:text-white">{request.title}</h4>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {request.description}
            </p>
          </div>
          <div className="mt-4 flex justify-end">
            <button 
              onClick={handleMessageClick}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-purple-600 text-white hover:bg-purple-700 transition-colors"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Message</span>
            </button>
          </div>
        </div>
      </div>

      <Modal
        isOpen={showMessageModal}
        onClose={() => setShowMessageModal(false)}
        title="Send Message"
      >
        <MessageModal 
          request={request} 
          onClose={() => setShowMessageModal(false)} 
        />
      </Modal>
    </>
  );
}