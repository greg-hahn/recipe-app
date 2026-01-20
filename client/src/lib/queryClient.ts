/**
 * TanStack Query Client Configuration
 * 
 * Configures React Query with:
 * - Default stale time and cache time
 * - Retry configuration
 * - Error handling
 */

import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Data is considered fresh for 5 minutes
      staleTime: 5 * 60 * 1000,
      
      // Cache data for 30 minutes
      gcTime: 30 * 60 * 1000,
      
      // Retry failed requests up to 2 times
      retry: (failureCount, error) => {
        // Don't retry if offline
        if (error && typeof error === 'object' && 'isOffline' in error && error.isOffline) {
          return false;
        }
        return failureCount < 2;
      },
      
      // Delay between retries
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      
      // Refetch on window focus only if data is stale
      refetchOnWindowFocus: 'always',
      
      // Don't refetch on reconnect automatically - we handle this manually
      refetchOnReconnect: true,
    },
    mutations: {
      // Retry mutations once
      retry: 1,
    },
  },
});
