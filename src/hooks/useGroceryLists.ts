import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { groceryService } from '../services/groceryService';
import { queryKeys } from '../config/queryClient';

/**
 * Hook for fetching and managing all grocery lists
 * Includes mutations for create, update, delete, and status change
 */
export const useGroceryLists = () => {
  const queryClient = useQueryClient();

  // Fetch all grocery lists
  const listsQuery = useQuery({
    queryKey: queryKeys.groceryLists,
    queryFn: groceryService.getGroceryLists,
  });

  // Create grocery list mutation
  const createListMutation = useMutation({
    mutationFn: ({ name, notes }: { name: string; notes?: string }) =>
      groceryService.createGroceryList(name, notes),
    onSuccess: () => {
      // Invalidate and refetch grocery lists
      queryClient.invalidateQueries({ queryKey: queryKeys.groceryLists });
    },
    onError: (error: Error) => {
      console.error('Failed to create grocery list:', error.message);
    },
  });

  // Update grocery list mutation
  const updateListMutation = useMutation({
    mutationFn: ({ listId, updates }: { listId: string; updates: { name?: string; notes?: string } }) =>
      groceryService.updateGroceryList(listId, updates),
    onSuccess: (_, variables) => {
      // Invalidate grocery lists and specific list
      queryClient.invalidateQueries({ queryKey: queryKeys.groceryLists });
      queryClient.invalidateQueries({ queryKey: queryKeys.groceryList(variables.listId) });
    },
    onError: (error: Error) => {
      console.error('Failed to update grocery list:', error.message);
    },
  });

  // Update list status mutation
  const updateStatusMutation = useMutation({
    mutationFn: ({ listId, status }: { listId: string; status: 'Active' | 'Completed' | 'Archived' }) =>
      groceryService.updateListStatus(listId, status),
    onSuccess: (_, variables) => {
      // Invalidate grocery lists and specific list
      queryClient.invalidateQueries({ queryKey: queryKeys.groceryLists });
      queryClient.invalidateQueries({ queryKey: queryKeys.groceryList(variables.listId) });
    },
    onError: (error: Error) => {
      console.error('Failed to update list status:', error.message);
    },
  });

  // Delete grocery list mutation
  const deleteListMutation = useMutation({
    mutationFn: (listId: string) => groceryService.deleteGroceryList(listId),
    onSuccess: (_, deletedListId) => {
      // Remove from cache and invalidate list
      queryClient.removeQueries({ queryKey: queryKeys.groceryList(deletedListId) });
      queryClient.removeQueries({ queryKey: queryKeys.groceryListItems(deletedListId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.groceryLists });
    },
    onError: (error: Error) => {
      console.error('Failed to delete grocery list:', error.message);
    },
  });

  return {
    // Query data
    lists: listsQuery.data || [],
    isLoading: listsQuery.isLoading,
    isError: listsQuery.isError,
    error: listsQuery.error,
    isRefetching: listsQuery.isRefetching,

    // Mutation functions
    createList: createListMutation.mutate,
    createListAsync: createListMutation.mutateAsync,
    isCreating: createListMutation.isPending,
    createError: createListMutation.error,

    updateList: updateListMutation.mutate,
    updateListAsync: updateListMutation.mutateAsync,
    isUpdating: updateListMutation.isPending,
    updateError: updateListMutation.error,

    updateStatus: updateStatusMutation.mutate,
    updateStatusAsync: updateStatusMutation.mutateAsync,
    isUpdatingStatus: updateStatusMutation.isPending,
    statusError: updateStatusMutation.error,

    deleteList: deleteListMutation.mutate,
    deleteListAsync: deleteListMutation.mutateAsync,
    isDeleting: deleteListMutation.isPending,
    deleteError: deleteListMutation.error,

    // Utility functions
    refetch: listsQuery.refetch,
  };
};

/**
 * Hook for fetching items in a specific grocery list
 * Includes mutations for add, remove, and toggle purchased status with optimistic updates
 * @param listId - Grocery list UUID
 */
export const useGroceryListItems = (listId: string) => {
  const queryClient = useQueryClient();

  // Fetch grocery list items
  const itemsQuery = useQuery({
    queryKey: queryKeys.groceryListItems(listId),
    queryFn: () => groceryService.getGroceryListItems(listId),
    enabled: !!listId, // Only run query if listId is provided
  });

  // Add item to list mutation
  const addItemMutation = useMutation({
    mutationFn: ({
      ingredientId,
      quantity,
      notes,
    }: {
      ingredientId: string;
      quantity?: string;
      notes?: string;
    }) => groceryService.addItemToList(listId, ingredientId, quantity, notes),
    onSuccess: () => {
      // Invalidate grocery list items
      queryClient.invalidateQueries({ queryKey: queryKeys.groceryListItems(listId) });
    },
    onError: (error: Error) => {
      console.error('Failed to add item to list:', error.message);
    },
  });

  // Remove item from list mutation
  const removeItemMutation = useMutation({
    mutationFn: (itemId: string) => groceryService.removeItemFromList(itemId),
    onSuccess: () => {
      // Invalidate grocery list items
      queryClient.invalidateQueries({ queryKey: queryKeys.groceryListItems(listId) });
    },
    onError: (error: Error) => {
      console.error('Failed to remove item from list:', error.message);
    },
  });

  // Toggle item purchased status with optimistic updates
  const togglePurchasedMutation = useMutation({
    mutationFn: ({ itemId, isPurchased }: { itemId: string; isPurchased: boolean }) =>
      groceryService.toggleItemPurchased(itemId, isPurchased),

    // Optimistic update for instant UI feedback
    onMutate: async ({ itemId, isPurchased }) => {
      // Cancel any outgoing refetches to prevent overwriting optimistic update
      await queryClient.cancelQueries({ queryKey: queryKeys.groceryListItems(listId) });

      // Snapshot the previous value
      const previousItems = queryClient.getQueryData(queryKeys.groceryListItems(listId));

      // Optimistically update to the new value
      queryClient.setQueryData(queryKeys.groceryListItems(listId), (old: any) => {
        if (!old) return old;
        return old.map((item: any) =>
          item.id === itemId ? { ...item, isPurchased } : item
        );
      });

      // Return context with snapshot for rollback
      return { previousItems };
    },

    // On error, rollback to previous value
    onError: (error: Error, variables, context) => {
      if (context?.previousItems) {
        queryClient.setQueryData(queryKeys.groceryListItems(listId), context.previousItems);
      }
      console.error('Failed to toggle item purchased status:', error.message);
    },

    // Always refetch after error or success to ensure sync with server
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.groceryListItems(listId) });
    },
  });

  return {
    // Query data
    items: itemsQuery.data || [],
    isLoading: itemsQuery.isLoading,
    isError: itemsQuery.isError,
    error: itemsQuery.error,
    isRefetching: itemsQuery.isRefetching,

    // Mutation functions
    addItem: addItemMutation.mutate,
    addItemAsync: addItemMutation.mutateAsync,
    isAddingItem: addItemMutation.isPending,
    addItemError: addItemMutation.error,

    removeItem: removeItemMutation.mutate,
    removeItemAsync: removeItemMutation.mutateAsync,
    isRemovingItem: removeItemMutation.isPending,
    removeItemError: removeItemMutation.error,

    togglePurchased: togglePurchasedMutation.mutate,
    togglePurchasedAsync: togglePurchasedMutation.mutateAsync,
    isTogglingPurchased: togglePurchasedMutation.isPending,
    toggleError: togglePurchasedMutation.error,

    // Utility functions
    refetch: itemsQuery.refetch,
  };
};

/**
 * Hook for fetching the shopping list (all ingredients marked "need to buy")
 * This is a user-wide view of all ingredients they need to purchase
 */
export const useShoppingList = () => {
  const shoppingListQuery = useQuery({
    queryKey: queryKeys.shoppingList,
    queryFn: groceryService.getShoppingListItems,
  });

  return {
    // Query data
    items: shoppingListQuery.data || [],
    isLoading: shoppingListQuery.isLoading,
    isError: shoppingListQuery.isError,
    error: shoppingListQuery.error,
    isRefetching: shoppingListQuery.isRefetching,

    // Utility functions
    refetch: shoppingListQuery.refetch,
  };
};
