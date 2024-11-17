import React, { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Header } from './components/Header';
import { FilterBar } from './components/FilterBar';
import { RequestGrid } from './components/RequestGrid';
import { OAuthCallback } from './components/OAuthCallback';
import { ErrorAlert } from './components/ErrorAlert';
import { Category } from './types';
import { UserProvider } from './context/UserContext';
import { useAuthCheck } from './hooks/useAuthCheck';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Footer } from './components/Footer';
import { socket } from './lib/socket';
import { useStore } from './store';
import { useStreamStatus } from './lib/twitch';

// Move queryClient outside the component
const queryClient = new QueryClient();

// Add custom scrollbar styles
const globalStyles = `
  ::-webkit-scrollbar {
    width: 10px;
    height: 10px;
  }

  ::-webkit-scrollbar-track {
    background: transparent;
  }

  ::-webkit-scrollbar-thumb {
    background: #CBD5E1;
    border-radius: 9999px;
    border: 3px solid transparent;
    background-clip: content-box;
  }

  ::-webkit-scrollbar-thumb:hover {
    background: #94A3B8;
    border: 3px solid transparent;
    background-clip: content-box;
  }

  .dark ::-webkit-scrollbar {
    width: 10px;
    height: 10px;
  }

  .dark ::-webkit-scrollbar-track {
    background: transparent;
  }

  .dark ::-webkit-scrollbar-thumb {
    background: #94A3B8;
    border-radius: 9999px;
    border: 3px solid rgba(0, 0, 0, 0);
    background-clip: content-box;
  }

  .dark ::-webkit-scrollbar-thumb:hover {
    background: #CBD5E1;
    border: 3px solid rgba(0, 0, 0, 0);
    background-clip: content-box;
  }
`;

function AppContent() {
  useAuthCheck();

  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [showLiveOnly, setShowLiveOnly] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<string | null>(null);
  const updateUserStatus = useStore(state => state.updateUserStatus);

  // This will set up the WebSocket listener for Twitch status updates
  useStreamStatus();

  React.useEffect(() => {
    if (!socket.connected) {
      socket.connect();
    }

    const handleStatusUpdate = ({ userId, isLive }: { userId: string, isLive: boolean }) => {
      console.log(`Received status update for ${userId}:`, isLive);
      updateUserStatus(userId, isLive);
    };

    const handleConnect = () => {
      console.log('Socket connected:', socket.id);
    };

    const handleDisconnect = () => {
      console.log('Socket disconnected');
    };

    const handleError = (error: Error) => {
      console.error('Socket error:', error);
    };

    // Set up all socket listeners
    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('error', handleError);
    socket.on('statusUpdate', handleStatusUpdate);

    // Cleanup all listeners
    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('error', handleError);
      socket.off('statusUpdate', handleStatusUpdate);
    };
  }, [updateUserStatus]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      <Routes>
        <Route path="/callback" element={<OAuthCallback />} />
        <Route
          path="/"
          element={
            <>
              <Header />
              <div className="bg-gray-100 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                <div className="max-w-[2000px] mx-auto px-4 sm:px-6 lg:px-8">
                  <div className="flex items-center justify-between py-4">
                    <FilterBar
                      selectedCategory={selectedCategory}
                      setSelectedCategory={setSelectedCategory}
                      showLiveOnly={showLiveOnly}
                      setShowLiveOnly={setShowLiveOnly}
                      selectedLanguage={selectedLanguage}
                      setSelectedLanguage={setSelectedLanguage}
                    />
                  </div>
                </div>
              </div>
              <RequestGrid
                selectedCategory={selectedCategory}
                showLiveOnly={showLiveOnly}
                selectedLanguage={selectedLanguage}
              />
              <div className="flex-grow" />
              <Footer />
            </>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <ErrorAlert />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <UserProvider>
        <style>{globalStyles}</style>
        <AppContent />
      </UserProvider>
    </QueryClientProvider>
  );
}

export default App;