import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import '@fontsource-variable/inter';
import '@fontsource-variable/jetbrains-mono';
import App from './App';
import './styles/globals.css';

// Create query client here to add devtools
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 2 * 60 * 1000,        // 2 min default
      gcTime: 10 * 60 * 1000,          // 10 min garbage collection
      retry: 1,
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10000),  // exponential backoff
      refetchOnWindowFocus: false,      // Don't refetch on every tab switch — financial data is not real-time
      refetchOnReconnect: 'always',     // Do refetch on network reconnect
      refetchOnMount: true,
    },
    mutations: {
      retry: 0,
      // Remove console.error — errors are handled per-mutation
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
      {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  </React.StrictMode>
);
