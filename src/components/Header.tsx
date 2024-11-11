import React from 'react';
import { Moon, Sun, MessageSquare, Plus } from 'lucide-react';
import { useDarkMode } from '../hooks/useDarkMode';
import { useStore } from '../store';
import { getTwitchAuthUrl } from '../lib/twitch';
import { Modal } from './Modal';
import { NewRequestForm } from './NewRequestForm';
import { InboxModal } from './InboxModal';

export function Header() {
  const { isDark, toggle } = useDarkMode();
  const user = useStore((state) => state.user);
  const unreadCount = useStore((state) => state.getUnreadCount());
  const [showInbox, setShowInbox] = React.useState(false);
  const [showNewRequest, setShowNewRequest] = React.useState(false);

  const handleLogin = () => {
    window.location.href = getTwitchAuthUrl();
  };

  const handleNewRequest = () => {
    if (!user) {
      handleLogin();
      return;
    }
    setShowNewRequest(true);
  };

  return (
    <header className="bg-white dark:bg-gray-800 shadow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Twitch Collab</h1>
        
        <div className="flex items-center gap-4">
          <button
            onClick={handleNewRequest}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-600 text-white hover:bg-purple-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Create Request</span>
          </button>

          {user && (
            <button
              onClick={() => setShowInbox(true)}
              className="relative p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
            >
              <MessageSquare className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-xs text-white">
                  {unreadCount}
                </span>
              )}
            </button>
          )}

          <button
            onClick={toggle}
            className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
          >
            {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>

          {user ? (
            <div className="flex items-center gap-3">
              <img
                src={user.profileImageUrl}
                alt={user.displayName}
                className="w-8 h-8 rounded-full"
              />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {user.displayName}
              </span>
            </div>
          ) : (
            <button
              onClick={handleLogin}
              className="px-4 py-2 rounded-lg bg-purple-600 text-white hover:bg-purple-700 transition-colors"
            >
              Login with Twitch
            </button>
          )}
        </div>
      </div>

      <Modal
        isOpen={showInbox}
        onClose={() => setShowInbox(false)}
        title="Messages"
      >
        <InboxModal onClose={() => setShowInbox(false)} />
      </Modal>

      <Modal
        isOpen={showNewRequest}
        onClose={() => setShowNewRequest(false)}
        title="Create New Request"
      >
        <NewRequestForm onClose={() => setShowNewRequest(false)} />
      </Modal>
    </header>
  );
}