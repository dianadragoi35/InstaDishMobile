import { useMutation } from '@tanstack/react-query';
import { aiRecipeGenerationService, GenerateRecipeOptions } from '../services/aiRecipeGenerationService';
import { ParseRecipeResponse } from '../types';

interface GenerateRecipeParams {
  ingredientsText: string;
  options?: GenerateRecipeOptions;
}

/**
 * React Query hook for generating recipes from ingredients using AI
 *
 * @example
 * const { mutate, isLoading, error, data } = useGenerateRecipe();
 * mutate({
 *   ingredientsText: "chicken, rice, tomatoes",
 *   options: { cuisine: "Italian", language: "English" }
 * });
 */
export const useGenerateRecipe = () => {
  const mutation = useMutation<ParseRecipeResponse, Error, GenerateRecipeParams>({
    mutationFn: async ({ ingredientsText, options }) => {
      return await aiRecipeGenerationService.generateRecipe(ingredientsText, options);
    },
  });

  return {
    ...mutation,
    isLoading: mutation.isPending, // React Query v5 uses isPending, but we expose isLoading for consistency
  };
};
