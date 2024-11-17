import React from 'react';
import { CollabRequest } from '../types';
import { MessageSquare, X } from 'lucide-react';
import { Modal } from './Modal';
import { MessageModal } from './MessageModal';
import { getTwitchAuthUrl } from '../lib/twitch';
import { deleteRequest } from '../api';
import { TOP_LANGUAGES } from '../utils/languages';
import ReactCountryFlag from 'react-country-flag';
import { formatMessageDate } from '../utils/dateFormat';
import { useStreamersStatus } from '../hooks/useStreamersStatus';

interface RequestCardProps {
  request: CollabRequest;
  onDelete?: () => void;
}

const CATEGORY_COLORS = [
  'bg-blue-100 text-blue-800',
  'bg-purple-100 text-purple-800',
  'bg-pink-100 text-pink-800',
  'bg-indigo-100 text-indigo-800',
  'bg-green-100 text-green-800',
  'bg-red-100 text-red-800',
  'bg-orange-100 text-orange-800',
  'bg-teal-100 text-teal-800',
];

const marqueeStyles = `
  @keyframes scroll {
    from { transform: translateX(0); }
    to { transform: translateX(-50%); }
  }
  
  .marquee-container {
    overflow: hidden;
    width: 100%;
    position: relative;
  }
  
  .marquee-content {
    display: flex;
    animation: scroll 20s linear infinite;
    white-space: nowrap;
    width: max-content;
  }
  
  .marquee-content:hover {
    animation-play-state: paused;
  }
`;

export function RequestCard({ request, onDelete }: RequestCardProps) {
  const [showMessageModal, setShowMessageModal] = React.useState(false);
  const [showDeleteModal, setShowDeleteModal] = React.useState(false);
  const [deleteError, setDeleteError] = React.useState<string | null>(null);
  const [isExpanded, setIsExpanded] = React.useState(false);
  const [expandedHeight, setExpandedHeight] = React.useState('h-[220px]');
  const descriptionRef = React.useRef<HTMLDivElement>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [key, setKey] = React.useState(0);
  
  const { data: streamersStatus } = useStreamersStatus(request?.user?.id ? [request.user.id] : []);
  const isLive = streamersStatus?.find(status => status.userId === request?.user?.id)?.isLive || false;

  React.useEffect(() => {
    if (isExpanded && descriptionRef.current) {
      const contentHeight = descriptionRef.current.scrollHeight;
      const baseHeight = 200;
      const padding = 20;
      setExpandedHeight(`h-[${baseHeight + Math.min(contentHeight, 100) + padding}px]`);
    } else {
      setExpandedHeight('h-[240px]');
    }
  }, [isExpanded]);

  React.useEffect(() => {
    if (request.user.title) {
      const element = document.querySelector('.animate-marquee') as HTMLElement;
      if (element) {
        const textWidth = element.offsetWidth;
        const duration = Math.max(textWidth / 50, 5); // adjust speed by changing divisor
        element.style.setProperty('--duration', `${duration}s`);
      }
    }
  }, [request.user.title]);

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

  const getCategoryColor = (category: string) => {
    const index = category.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return CATEGORY_COLORS[index % CATEGORY_COLORS.length];
  };

  return (
    <>
      <div 
        key={key}
        className={`bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-all duration-200 overflow-hidden relative ${
          isExpanded ? expandedHeight : 'h-[250px]'
        }`}
        style={{ contain: 'paint', width: ' 350px' }}
      >
        {isOwner && (
          <button
            onClick={() => setShowDeleteModal(true)}
            className="absolute top-1 right-1 p-2 text-gray-400 hover:text-red-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
        <div className="p-8 h-full flex flex-col">
          <div className="flex justify-between items-start gap-6">
            <div className="flex gap-4" style={{ width: '85%' }}>
              <div className="relative">
                <img
                  src={request.user.profileImageUrl}
                  alt={request.user.displayName}
                  className="w-16 h-16 rounded-full"
                />
                <div className="absolute -top-0.5 right-2 translate-x-1/4">
                  <span className="flex h-3 w-3">
                    {isLive && (
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 bg-red-400" />
                    )}
                    <span className={`relative inline-flex rounded-full h-3 w-3 ${isLive ? 'bg-red-500' : 'bg-gray-400'}`} />
                  </span>
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white truncate leading-tight">
                    {request.user.displayName}
                  </h3>
                  {request.language && (
                    <ReactCountryFlag
                      countryCode={TOP_LANGUAGES.find(l => l.code === request.language)?.countryCode || ''}
                      svg
                      className="w-5 h-4 object-contain"
                      title={TOP_LANGUAGES.find(l => l.code === request.language)?.name}
                    />
                  )}
                </div>
                {request.user.category && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                    {request.user.category}
                  </p>
                )}
                {request.user.title && (
                  <div className="max-w-[200px]">
                    <style>{marqueeStyles}</style>
                    <div className="marquee-container">
                      <div className="marquee-content">
                        <span className="text-[14px] text-gray-700 dark:text-gray-200 px-2">
                          {request.user.title}
                        </span>
                        <span className="text-[14px] text-gray-700 dark:text-gray-200 px-2">
                          {request.user.title}
                        </span>
                        <span className="text-[14px] text-gray-700 dark:text-gray-200 px-2">
                          {request.user.title}
                        </span>
                        <span className="text-[14px] text-gray-700 dark:text-gray-200 px-2">
                          {request.user.title}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <button 
              onClick={handleMessageClick}
              className="p-2.5 text-gray-600 hover:text-green-600 active:text-green-800 transition-colors shrink-0"
            >
              <MessageSquare className="-mt-1.5 -ml-8 w-6.5px h-6.5px" />
            </button>
          </div>
          
          <div className="flex flex-wrap gap-1.5 mt-4">
            {request.categories?.map(category => (
              <span 
                key={category}
                className={`inline-block ${getCategoryColor(category)} text-[11px] font-medium px-2 py-0.5 rounded-full`}
              >
                {category}
              </span>
            ))}
          </div>
          
          <div className="mt-4 flex-1 relative">
            <div 
              className="flex items-center gap-2 cursor-pointer"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              <h4 className="text-xl font-bold text-gray-900 dark:text-white truncate leading-tight pb-0.5">
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
                  dark:[&::-webkit-scrollbar-thumb]:bg-gray-700
                  break-words whitespace-pre-wrap"
              >
                <div className="max-w-full">
                  {request.description}
                </div>
              </div>
            </div>
          </div>
          
          <div className="absolute bottom-3 right-4 text-xs text-gray-500 dark:text-gray-400">
            {formatMessageDate(request.created_at)}
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