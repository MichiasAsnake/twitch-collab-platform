import React from 'react';
import { CollabRequest } from '../types';
import { MessageSquare, X } from 'lucide-react';
import { Modal } from './Modal';
import { MessageModal } from './MessageModal';
import { getTwitchAuthUrl } from '../lib/twitch';
import { deleteRequest } from '../api';

interface RequestCardProps {
  request: CollabRequest;
  onDelete?: () => void;
}

export function RequestCard({ request, onDelete }: RequestCardProps) {
  const [showMessageModal, setShowMessageModal] = React.useState(false);
  const [showDeleteModal, setShowDeleteModal] = React.useState(false);
  const [deleteError, setDeleteError] = React.useState<string | null>(null);
  const [isExpanded, setIsExpanded] = React.useState(false);
  const [expandedHeight, setExpandedHeight] = React.useState('h-[160px]');
  const descriptionRef = React.useRef<HTMLDivElement>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);

  React.useEffect(() => {
    if (isExpanded && descriptionRef.current) {
      const contentHeight = descriptionRef.current.scrollHeight;
      const baseHeight = 160;
      const padding = 20;
      setExpandedHeight(`h-[${baseHeight + Math.min(contentHeight, 100) + padding}px]`);
    } else {
      setExpandedHeight('h-[160px]');
    }
  }, [isExpanded]);

  const handleMessageClick = () => {
    setShowMessageModal(true);
  };

  const handleDelete = async () => {
    try {
      const token = localStorage.getItem('twitch_token');
      if (!token) {
        window.location.href = getTwitchAuthUrl();
        return;
      }

      setIsDeleting(true);
      setDeleteError(null);
      
      await deleteRequest(request.id);
      onDelete?.();
      setShowDeleteModal(false);
    } catch (error) {
      console.error('Error deleting request:', error);
      if (error instanceof Error && error.message === 'Invalid Twitch token') {
        window.location.href = getTwitchAuthUrl();
        return;
      }
      setDeleteError(error instanceof Error ? error.message : 'Failed to delete request');
    } finally {
      setIsDeleting(false);
    }
  };

  const isOwner = React.useMemo(() => {
    const userId = localStorage.getItem('twitch_user_id');
    console.log('Stored user ID:', userId);
    console.log('Request user ID:', request.user.id);
    console.log('Do they match?', userId === request.user.id);
    return userId === request.user.id;
  }, [request.user.id]);

  return (
    <>
      <div className={`bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-all duration-200 overflow-hidden relative ${
        isExpanded ? expandedHeight : 'h-[160px]'
      }`}>
        {isOwner && (
          <button
            onClick={() => setShowDeleteModal(true)}
            className="absolute top-2 right-2 p-1.5 text-gray-400 hover:text-red-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
        <div className="p-6 h-full flex flex-col">
          <div className="flex justify-between items-start">
            <div className="flex gap-4 flex-1">
              <div className="relative">
                <img
                  src={request.user.profileImageUrl}
                  alt={request.user.displayName}
                  className="w-16 h-16 rounded-full"
                />
                <div className="absolute -top-0.5 -right-0.5">
                  <span className="flex h-3 w-3">
                    <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                      request.user.isLive ? 'bg-green-400' : 'bg-gray-300'
                    }`}></span>
                    <span className={`relative inline-flex rounded-full h-3 w-3 ${
                      request.user.isLive ? 'bg-green-500' : 'bg-gray-400'
                    }`}></span>
                  </span>
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white truncate leading-tight">
                  {request.user.displayName}
                </h3>
                {request.user.category && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                    {request.user.category}
                  </p>
                )}
                {request.user.title && (
                  <p className="text-sm text-purple-600 dark:text-purple-400 truncate mt-0.5">
                    {request.user.title}
                  </p>
                )}
              </div>
            </div>
            <button 
              onClick={handleMessageClick}
              className="p-2 text-gray-500 hover:text-purple-600 active:text-purple-800 transition-colors rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 -mt-1"
            >
              <MessageSquare className="w-5 h-5" />
            </button>
          </div>
          
          <div className="mt-4 flex-1 relative">
            <div 
              className="flex items-center gap-2 cursor-pointer"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              <h4 className="text-lg font-bold text-gray-900 dark:text-white truncate leading-tight pb-0.5">
                {request.title}
              </h4>
              <svg
                className={`w-4 h-4 shrink-0 text-gray-500 transition-transform duration-200 ${
                  isExpanded ? 'rotate-180' : ''
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </div>
            <div
              className={`transition-all duration-200 ${
                isExpanded ? 'opacity-100' : 'opacity-0 hidden'
              }`}
            >
              <div 
                ref={descriptionRef}
                className="text-base text-gray-600 dark:text-gray-300 mt-3 overflow-y-auto max-h-[100px] pr-4
                  [&::-webkit-scrollbar]:w-2
                  [&::-webkit-scrollbar-track]:bg-transparent
                  [&::-webkit-scrollbar-thumb]:bg-gray-200
                  [&::-webkit-scrollbar-thumb]:rounded-full
                  dark:[&::-webkit-scrollbar-thumb]:bg-gray-700"
              >
                {request.description}
              </div>
            </div>
          </div>
        </div>
      </div>

      {showDeleteModal && (
        <Modal
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          title="Delete Request"
        >
          <div className="p-6">
            <p className="text-gray-700 dark:text-gray-300 mb-6">
              Are you sure you want to delete this request?
            </p>
            <div className="flex justify-end gap-4">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                No, Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </Modal>
      )}

      {showMessageModal && (
        <Modal
          isOpen={showMessageModal}
          onClose={() => setShowMessageModal(false)}
          title="Send Message"
        >
          <MessageModal 
            onClose={() => setShowMessageModal(false)}
            requestId={request.id}
            toUserId={request.user.id}
          />
        </Modal>
      )}
    </>
  );
}