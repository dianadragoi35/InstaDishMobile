import { QueryClient } from '@tanstack/react-query';

/**
 * React Query Client Configuration
 * Manages data fetching, caching, and synchronization
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Cache data for 5 minutes before marking as stale
      staleTime: 1000 * 60 * 5, // 5 minutes

      // Keep unused data in cache for 10 minutes
      gcTime: 1000 * 60 * 10, // 10 minutes (formerly cacheTime)

      // Retry failed queries up to 2 times
      retry: 2,

      // Exponential backoff for retries
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),

      // Don't refetch on window focus by default (can enable per-query)
      refetchOnWindowFocus: false,

      // Refetch on reconnect if data is stale
      refetchOnReconnect: true,

      // Don't refetch on mount if data is fresh
      refetchOnMount: false,
    },
    mutations: {
      // Retry failed mutations once
      retry: 1,

      // Exponential backoff for mutation retries
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
  },
});

/**
 * Query Keys
 * Centralized query key definitions for consistency
 */
export const queryKeys = {
  // Recipe queries
  recipes: ['recipes'] as const,
  recipe: (id: string) => ['recipe', id] as const,
  recipeIngredients: (recipeId: string) => ['recipe-ingredients', recipeId] as const,

  // Grocery list queries
  groceryLists: ['grocery-lists'] as const,
  groceryList: (id: string) => ['grocery-list', id] as const,
  groceryListItems: (listId: string) => ['grocery-list-items', listId] as const,
  shoppingList: ['shopping-list'] as const,

  // Ingredient queries
  ingredients: ['ingredients'] as const,
  ingredient: (id: string) => ['ingredient', id] as const,
};
