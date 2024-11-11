import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from 'react-query';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5, // 5 minutes
      onError: (error: unknown) => {
        const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
        console.error('Query error:', errorMessage);
      },
    },
    mutations: {
      onError: (error: unknown) => {
        const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
        console.error('Mutation error:', errorMessage);
      },
    },
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </BrowserRouter>
  </StrictMode>
);