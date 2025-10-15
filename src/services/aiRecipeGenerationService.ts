import Constants from 'expo-constants';
import { ParseRecipeResponse } from '../types';

const API_BASE_URL = Constants.expoConfig?.extra?.apiBaseUrl || 'http://localhost:3000';

export interface GenerateRecipeOptions {
  cuisine?: string;
  language?: string;
}

/**
 * AI Recipe Generation Service
 * Handles generation of recipes from ingredient lists using Google Gemini AI
 */
export const aiRecipeGenerationService = {
  /**
   * Generate a recipe from a list of ingredients
   * @param ingredientsText - Comma-separated ingredients (e.g., "chicken, rice, tomatoes")
   * @param options - Optional cuisine preference and language
   * @returns Generated recipe with name, ingredients, instructions, and timing
   * @throws Error if API request fails or returns invalid data
   */
  async generateRecipe(
    ingredientsText: string,
    options?: GenerateRecipeOptions
  ): Promise<ParseRecipeResponse> {
    if (!ingredientsText?.trim()) {
      throw new Error('Ingredients are required to generate a recipe');
    }

    const url = `${API_BASE_URL}/api/recipes/generate`;
    console.log('🍳 Generating recipe...');
    console.log('📍 API URL:', url);
    console.log('📝 Ingredients:', ingredientsText.trim());
    console.log('🌍 Cuisine:', options?.cuisine || 'Any');

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ingredients: ingredientsText.trim(),
          cuisine: options?.cuisine?.trim() || '',
          language: options?.language?.trim() || 'English',
        }),
      });

      console.log('📡 Response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error ||
          errorData.suggestion ||
          `Failed to generate recipe (${response.status})`
        );
      }

      const data: ParseRecipeResponse = await response.json();

      // Validate response structure
      if (!data.recipeName || !data.ingredients || !data.instructions) {
        throw new Error('Invalid recipe data received from AI service');
      }

      if (data.ingredients.length === 0) {
        throw new Error('AI service returned a recipe without ingredients');
      }

      console.log('✅ Recipe generated successfully!');
      return data;
    } catch (error) {
      console.error('❌ Recipe generation error:', error);
      if (error instanceof Error) {
        console.error('Error message:', error.message);
        throw error;
      }
      throw new Error('Failed to generate recipe. Please try again.');
    }
  },

  /**
   * Check if the AI API is available and healthy
   * @returns True if API is reachable
   */
  async checkApiHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/health`, {
        method: 'GET',
      });
      return response.ok;
    } catch {
      return false;
    }
  },
};
