import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Header } from './components/Header';
import { FilterBar } from './components/FilterBar';
import { RequestGrid } from './components/RequestGrid';
import { OAuthCallback } from './components/OAuthCallback';
import { ErrorAlert } from './components/ErrorAlert';
import { useSocket } from './hooks/useSocket';
import { Category } from './types';

function App() {
  const [selectedCategory, setSelectedCategory] = React.useState<Category | null>(null);
  const [showLiveOnly, setShowLiveOnly] = React.useState(false);

  // Initialize WebSocket connection
  useSocket();

  return (
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
  );
}