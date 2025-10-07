import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { groceryService } from '../services/groceryService';
import { ingredientService } from '../services/ingredientService';
import { Ingredient } from '../types';

/**
 * Custom hook for managing shopping list (ingredients marked "need to buy")
 * Provides data fetching and mutations with automatic cache invalidation
 */
export function useShoppingList() {
  const queryClient = useQueryClient();

  /**
   * Fetch all ingredients marked as "need to buy"
   */
  const {
    data: items = [],
    isLoading,
    error,
    refetch,
  } = useQuery<Ingredient[]>({
    queryKey: ['shoppingList'],
    queryFn: () => groceryService.getShoppingListItems(),
  });

  /**
   * Toggle need_to_buy status for an ingredient
   */
  const { mutate: toggleNeedToBuy } = useMutation({
    mutationFn: ({ ingredientId, needToBuy }: { ingredientId: string; needToBuy: boolean }) =>
      ingredientService.updateNeedToBuy(ingredientId, needToBuy),
    onMutate: async ({ ingredientId, needToBuy }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['shoppingList'] });

      // Snapshot previous value
      const previousItems = queryClient.getQueryData<Ingredient[]>(['shoppingList']);

      // Optimistically update - keep items in list but update their status
      queryClient.setQueryData<Ingredient[]>(['shoppingList'], (old = []) =>
        old.map((item) =>
          item.id === ingredientId ? { ...item, needToBuy } : item
        )
      );

      return { previousItems };
    },
    onError: (_err, _variables, context) => {
      // Rollback on error
      if (context?.previousItems) {
        queryClient.setQueryData(['shoppingList'], context.previousItems);
      }
    },
    // Don't refetch after toggle - keep optimistic updates
    // User can manually refresh to sync if needed
  });

  /**
   * Clear all items from shopping list
   */
  const { mutate: clearAllItems, isPending: isClearing } = useMutation({
    mutationFn: () => ingredientService.clearShoppingList(),
    onSuccess: () => {
      // Clear the cache and refetch
      queryClient.setQueryData<Ingredient[]>(['shoppingList'], []);
      queryClient.invalidateQueries({ queryKey: ['shoppingList'] });
    },
  });

  return {
    items,
    isLoading,
    error,
    toggleNeedToBuy,
    clearAllItems,
    isClearing,
    refetch,
  };
}
