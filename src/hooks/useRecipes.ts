import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { recipeService } from '../services/recipeService';
import { CreateRecipeRequest, UpdateRecipeRequest } from '../types';
import { queryKeys } from '../config/queryClient';

/**
 * Hook for fetching and managing the list of all recipes
 * Includes mutations for create, update, and delete operations
 */
export const useRecipes = () => {
  const queryClient = useQueryClient();

  // Fetch all recipes
  const recipesQuery = useQuery({
    queryKey: queryKeys.recipes,
    queryFn: recipeService.getRecipes,
  });

  // Create recipe mutation
  const createRecipeMutation = useMutation({
    mutationFn: (request: CreateRecipeRequest) => recipeService.createRecipe(request),
    onSuccess: () => {
      // Invalidate and refetch recipes list
      queryClient.invalidateQueries({ queryKey: queryKeys.recipes });
    },
    onError: (error: Error) => {
      console.error('Failed to create recipe:', error.message);
    },
  });

  // Update recipe mutation
  const updateRecipeMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: UpdateRecipeRequest }) =>
      recipeService.updateRecipe(id, updates),
    onSuccess: (_, variables) => {
      // Invalidate recipes list and specific recipe
      queryClient.invalidateQueries({ queryKey: queryKeys.recipes });
      queryClient.invalidateQueries({ queryKey: queryKeys.recipe(variables.id) });
    },
    onError: (error: Error) => {
      console.error('Failed to update recipe:', error.message);
    },
  });

  // Delete recipe mutation
  const deleteRecipeMutation = useMutation({
    mutationFn: (id: string) => recipeService.deleteRecipe(id),
    onSuccess: (_, deletedId) => {
      // Remove from cache and invalidate list
      queryClient.removeQueries({ queryKey: queryKeys.recipe(deletedId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.recipes });
    },
    onError: (error: Error) => {
      console.error('Failed to delete recipe:', error.message);
    },
  });

  // Search recipes mutation (not cached, runs on demand)
  const searchRecipesMutation = useMutation({
    mutationFn: (query: string) => recipeService.searchRecipes(query),
  });

  return {
    // Query data
    recipes: recipesQuery.data || [],
    isLoading: recipesQuery.isLoading,
    isError: recipesQuery.isError,
    error: recipesQuery.error,
    isRefetching: recipesQuery.isRefetching,

    // Mutation functions
    createRecipe: createRecipeMutation.mutate,
    createRecipeAsync: createRecipeMutation.mutateAsync,
    isCreating: createRecipeMutation.isPending,
    createError: createRecipeMutation.error,

    updateRecipe: updateRecipeMutation.mutate,
    updateRecipeAsync: updateRecipeMutation.mutateAsync,
    isUpdating: updateRecipeMutation.isPending,
    updateError: updateRecipeMutation.error,

    deleteRecipe: deleteRecipeMutation.mutate,
    deleteRecipeAsync: deleteRecipeMutation.mutateAsync,
    isDeleting: deleteRecipeMutation.isPending,
    deleteError: deleteRecipeMutation.error,

    searchRecipes: searchRecipesMutation.mutate,
    searchRecipesAsync: searchRecipesMutation.mutateAsync,
    searchResults: searchRecipesMutation.data,
    isSearching: searchRecipesMutation.isPending,
    searchError: searchRecipesMutation.error,

    // Utility functions
    refetch: recipesQuery.refetch,
  };
};

/**
 * Hook for fetching a single recipe by ID
 * @param id - Recipe UUID
 */
export const useRecipeDetail = (id: string) => {
  const queryClient = useQueryClient();

  const recipeQuery = useQuery({
    queryKey: queryKeys.recipe(id),
    queryFn: () => recipeService.getRecipeById(id),
    enabled: !!id, // Only run query if ID is provided
  });

  // Update recipe mutation (scoped to this recipe)
  const updateRecipeMutation = useMutation({
    mutationFn: (updates: UpdateRecipeRequest) => recipeService.updateRecipe(id, updates),
    onSuccess: () => {
      // Invalidate this recipe and the recipes list
      queryClient.invalidateQueries({ queryKey: queryKeys.recipe(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.recipes });
    },
    onError: (error: Error) => {
      console.error('Failed to update recipe:', error.message);
    },
  });

  // Delete recipe mutation (scoped to this recipe)
  const deleteRecipeMutation = useMutation({
    mutationFn: () => recipeService.deleteRecipe(id),
    onSuccess: () => {
      // Remove from cache and invalidate list
      queryClient.removeQueries({ queryKey: queryKeys.recipe(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.recipes });
    },
    onError: (error: Error) => {
      console.error('Failed to delete recipe:', error.message);
    },
  });

  return {
    // Query data
    recipe: recipeQuery.data,
    isLoading: recipeQuery.isLoading,
    isError: recipeQuery.isError,
    error: recipeQuery.error,
    isRefetching: recipeQuery.isRefetching,

    // Mutation functions
    updateRecipe: updateRecipeMutation.mutate,
    updateRecipeAsync: updateRecipeMutation.mutateAsync,
    isUpdating: updateRecipeMutation.isPending,
    updateError: updateRecipeMutation.error,

    deleteRecipe: deleteRecipeMutation.mutate,
    deleteRecipeAsync: deleteRecipeMutation.mutateAsync,
    isDeleting: deleteRecipeMutation.isPending,
    deleteError: deleteRecipeMutation.error,

    // Utility functions
    refetch: recipeQuery.refetch,
  };
};

/**
 * Hook for fetching ingredients for a specific recipe
 * @param recipeId - Recipe UUID
 */
export const useRecipeIngredients = (recipeId: string) => {
  const ingredientsQuery = useQuery({
    queryKey: queryKeys.recipeIngredients(recipeId),
    queryFn: () => recipeService.getRecipeIngredients(recipeId),
    enabled: !!recipeId, // Only run query if recipeId is provided
  });

  return {
    // Query data
    ingredients: ingredientsQuery.data || [],
    isLoading: ingredientsQuery.isLoading,
    isError: ingredientsQuery.isError,
    error: ingredientsQuery.error,
    isRefetching: ingredientsQuery.isRefetching,

    // Utility functions
    refetch: ingredientsQuery.refetch,
  };
};
