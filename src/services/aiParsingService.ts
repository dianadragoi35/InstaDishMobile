import { ParseRecipeRequest, ParseRecipeResponse } from '../types';
import Constants from 'expo-constants';

const API_BASE_URL = Constants.expoConfig?.extra?.apiBaseUrl || process.env.EXPO_PUBLIC_API_BASE_URL;

/**
 * Maximum number of retry attempts for failed requests
 */
const MAX_RETRIES = 3;

/**
 * Delay between retry attempts in milliseconds
 */
const RETRY_DELAY = 1000;

/**
 * Validate parsed recipe data structure
 * Ensures all required fields are present and properly formatted
 * @param data - Raw data from API response
 * @throws Error if validation fails
 */
function validateParsedRecipe(data: any): asserts data is ParseRecipeResponse {
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid parsed recipe: Response is not an object');
  }

  // Validate required string fields
  const requiredStringFields = ['recipeName', 'instructions'];
  for (const field of requiredStringFields) {
    if (!data[field] || typeof data[field] !== 'string' || !data[field].trim()) {
      throw new Error(`Invalid parsed recipe: Missing or empty ${field}`);
    }
  }

  // Validate optional string fields (can be empty but must be strings if present)
  const optionalStringFields = ['prepTime', 'cookTime', 'servings'];
  for (const field of optionalStringFields) {
    if (data[field] !== undefined && typeof data[field] !== 'string') {
      throw new Error(`Invalid parsed recipe: ${field} must be a string`);
    }
  }

  // Validate ingredients array
  if (!Array.isArray(data.ingredients)) {
    throw new Error('Invalid parsed recipe: ingredients must be an array');
  }

  if (data.ingredients.length === 0) {
    throw new Error('Invalid parsed recipe: At least one ingredient is required');
  }

  // Validate each ingredient
  for (let i = 0; i < data.ingredients.length; i++) {
    const ingredient = data.ingredients[i];

    if (!ingredient || typeof ingredient !== 'object') {
      throw new Error(`Invalid parsed recipe: Ingredient at index ${i} is not an object`);
    }

    if (!ingredient.name || typeof ingredient.name !== 'string' || !ingredient.name.trim()) {
      throw new Error(`Invalid parsed recipe: Ingredient at index ${i} missing or empty name`);
    }

    if (!ingredient.quantity || typeof ingredient.quantity !== 'string') {
      throw new Error(`Invalid parsed recipe: Ingredient at index ${i} missing or invalid quantity`);
    }

    // Notes are optional
    if (ingredient.notes !== undefined && typeof ingredient.notes !== 'string') {
      throw new Error(`Invalid parsed recipe: Ingredient at index ${i} has invalid notes`);
    }
  }
}

/**
 * AI Parsing Service
 * Handles communication with backend API for AI-powered recipe parsing using Google Gemini
 * Note: Gemini API key remains secure server-side
 */
export const aiParsingService = {
  /**
   * Parse recipe text using AI backend API
   * Includes automatic retry logic for network failures
   * @param request - Recipe parsing request with recipe text and optional language
   * @returns Parsed recipe data with structured ingredients and metadata
   * @throws Error if API call fails after all retries or if validation fails
   */
  async parseRecipe(request: ParseRecipeRequest): Promise<ParseRecipeResponse> {
    // Validate input
    if (!request.recipeText?.trim()) {
      throw new Error('Recipe text is required');
    }

    if (!API_BASE_URL) {
      throw new Error(
        'API base URL is not configured. Please set EXPO_PUBLIC_API_BASE_URL in your environment variables.'
      );
    }

    // Attempt API call with retry logic
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        const response = await fetch(`${API_BASE_URL}/recipes/parse`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            recipeText: request.recipeText.trim(),
            language: request.language || 'English',
          }),
        });

        // Handle non-OK responses
        if (!response.ok) {
          let errorMessage = 'Failed to parse recipe';

          try {
            const errorData = await response.json();
            errorMessage = errorData.message || errorData.error || errorMessage;
          } catch {
            // If error response isn't JSON, use status text
            errorMessage = `${errorMessage}: ${response.statusText}`;
          }

          // Don't retry for client errors (4xx)
          if (response.status >= 400 && response.status < 500) {
            throw new Error(errorMessage);
          }

          // Retry for server errors (5xx)
          throw new Error(`Server error: ${errorMessage}`);
        }

        // Parse successful response
        const data = await response.json();

        // Validate response structure
        validateParsedRecipe(data);

        return data;
      } catch (error) {
        lastError = error as Error;

        // Don't retry on validation errors or client errors
        if (
          error instanceof Error &&
          (error.message.includes('Invalid parsed recipe') ||
           error.message.includes('Failed to parse recipe'))
        ) {
          throw error;
        }

        // If this was the last attempt, throw the error
        if (attempt === MAX_RETRIES) {
          break;
        }

        // Wait before retrying (exponential backoff)
        await this.delay(RETRY_DELAY * attempt);
      }
    }

    // If we get here, all retries failed
    throw new Error(
      `Failed to parse recipe after ${MAX_RETRIES} attempts: ${lastError?.message || 'Unknown error'}`
    );
  },

  /**
   * Delay utility for retry logic
   * @param ms - Milliseconds to delay
   * @returns Promise that resolves after the delay
   */
  delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  },

  /**
   * Check if API is reachable (health check)
   * Useful for showing connection status in UI
   * @returns True if API is reachable, false otherwise
   */
  async checkApiHealth(): Promise<boolean> {
    if (!API_BASE_URL) {
      return false;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      return response.ok;
    } catch {
      return false;
    }
  },
};
