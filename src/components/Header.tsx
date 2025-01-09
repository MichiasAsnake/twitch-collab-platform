import React from 'react';
import { Moon, Sun, MessageSquare, Plus, Waves, LogOut } from 'lucide-react';
import { useDarkMode } from '../hooks/useDarkMode';
import { useStore } from '../store';
import { getTwitchAuthUrl } from '../lib/twitch';
import { Modal } from '../components/Modal';
import { NewRequestForm } from '../components/NewRequestForm';
import { InboxModal } from '../components/InboxModal';
import { socket } from '../lib/socket';
import { Message } from '../types';

export function Header() {
  const { isDark, toggle } = useDarkMode();
  const user = useStore((state) => state.user);
  const unreadCount = useStore((state) => state.getUnreadCount());
  const addMessage = useStore((state) => state.addMessage);
  const [showInbox, setShowInbox] = React.useState(false);
  const [showNewRequest, setShowNewRequest] = React.useState(false);
  const clearAuth = useStore((state) => state.clearAuth);
  const [showUserMenu, setShowUserMenu] = React.useState(false);

  React.useEffect(() => {
    if (!user) return;

    const handleStatusUpdate = ({ userId, isLive }: { userId: string, isLive: boolean }) => {
      if (userId === user.id) {
        useStore.setState((state) => ({
          user: { ...state.user!, isLive }
        }));
      }
    };

    const handleNewMessage = (message: Message) => {
      console.log('New message received:', message);
      if (message.toUser.id === user.id) {
        console.log('Adding unread message for:', user.id);
        addMessage({ ...message, read: false });
      }
    };

    socket.on('statusUpdate', handleStatusUpdate);
    socket.on('new_message', handleNewMessage);

    return () => {
      socket.off('statusUpdate', handleStatusUpdate);
      socket.off('new_message', handleNewMessage);
    };
  }, [user, addMessage]);

  React.useEffect(() => {
    console.log('Current unread count:', unreadCount);
  }, [unreadCount]);

  console.log('Unread count:', unreadCount);

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

  const handleLogout = () => {
    clearAuth();
    setShowUserMenu(false);
  };

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showUserMenu && !(event.target as Element).closest('.relative')) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showUserMenu]);

  return (
    <header className="bg-white dark:bg-gray-800 shadow">
      <div className="max-w-12xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
            <span className="text-white text-2xl">👋</span>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">yO</h1>
        </div>
        
        <div className="flex items-center gap-4">
          <button
            onClick={handleNewRequest}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-md text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors font-semibold text-base"
          >
            <Plus className="w-5 h-5" />
            <span>Create Request</span>
          </button>

          {user && (
            <button
              onClick={() => setShowInbox(true)}
              className="relative p-2 rounded-lg text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
            >
              <MessageSquare className="w-6 h-6" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-xs text-white">
                  {unreadCount}
                </span>
              )}
            </button>
          )}

          <button
            onClick={toggle}
            className="p-2 rounded-lg text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
          >
            {isDark ? <Sun className="w-6 h-6" /> : <Moon className="w-6 h-6" />}
          </button>

          {user ? (
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-3 hover:opacity-80"
              >
                <img
                  src={user.profileImageUrl}
                  alt={user.displayName}
                  className="w-[30px] h-[30px] rounded-full"
                />
                <span className="text-base font-medium text-gray-700 dark:text-gray-300">
                  {user.displayName}
                </span>
              </button>

              {showUserMenu && (
                <div className="absolute right-1/2 translate-x-1/2 mt-2 w-48 py-1 bg-white dark:bg-gray-800 rounded-md shadow-lg ring-1 ring-black ring-opacity-5">
                  <button
                    onClick={handleLogout}
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={handleLogin}
              className="px-4 py-2 rounded-md bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
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