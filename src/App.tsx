import React, { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Header } from './components/Header';
import { FilterBar } from './components/FilterBar';
import { RequestGrid } from './components/RequestGrid';
import { OAuthCallback } from './components/OAuthCallback';
import { ErrorAlert } from './components/ErrorAlert';
import { useSocket } from './hooks/useSocket';
import { Category } from './types';
import { UserProvider } from './context/UserContext';
import { useAuthCheck } from './hooks/useAuthCheck';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Move queryClient outside the component
const queryClient = new QueryClient();

function App() {
  useAuthCheck();

  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [showLiveOnly, setShowLiveOnly] = useState(false);

  return (
    <QueryClientProvider client={queryClient}>
      <UserProvider>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
          <Routes>
            <Route path="/callback" element={<OAuthCallback />} />
            <Route
              path="/"
              element={
                <>
                  <Header />
                  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between py-4">
                      <FilterBar
                        selectedCategory={selectedCategory}
                        setSelectedCategory={setSelectedCategory}
                        showLiveOnly={showLiveOnly}
                        setShowLiveOnly={setShowLiveOnly}
                      />
                    </div>
                  </div>
                  <RequestGrid
                    selectedCategory={selectedCategory}
                    showLiveOnly={showLiveOnly}
                  />
                </>
              }
            />
            {/* Catch all route */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          <ErrorAlert />
        </div>
      </UserProvider>
    </QueryClientProvider>
  );
}

export default App;