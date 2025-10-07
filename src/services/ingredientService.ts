import { supabase } from './supabase';
import { Ingredient } from '../types';

/**
 * Ingredient Service
 * Handles all ingredient-related database operations using Supabase
 */
export const ingredientService = {
  /**
   * Search ingredients by name (case-insensitive)
   * Used for autocomplete when adding ingredients to grocery lists
   * @param query - Search query string
   * @param limit - Maximum number of results to return (default: 20)
   * @returns Array of matching ingredients ordered by name
   * @throws Error if database error occurs
   */
  async searchIngredients(query: string, limit: number = 20): Promise<Ingredient[]> {
    if (!query?.trim()) {
      return [];
    }

    const searchQuery = query.trim();

    const { data, error } = await supabase
      .from('ingredients')
      .select('*')
      .ilike('name', `%${searchQuery}%`)
      .order('name', { ascending: true })
      .limit(limit);

    if (error) {
      throw new Error(`Failed to search ingredients: ${error.message}`);
    }

    return data.map(item => ({
      id: item.id,
      name: item.name,
      inPantry: item.in_pantry,
      needToBuy: item.need_to_buy,
      updatedAt: item.updated_at,
    }));
  },

  /**
   * Get or create an ingredient by name
   * If ingredient exists, returns existing one; otherwise creates new one
   * @param name - Ingredient name
   * @returns Ingredient ID
   * @throws Error if not authenticated or database error occurs
   */
  async getOrCreateIngredient(name: string): Promise<string> {
    // Verify user is authenticated
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('Not authenticated. Please log in.');
    }

    if (!name?.trim()) {
      throw new Error('Ingredient name is required');
    }

    const ingredientName = name.trim();

    // Try to find existing ingredient
    const { data: existingIngredient } = await supabase
      .from('ingredients')
      .select('id')
      .eq('user_id', user.id)
      .eq('name', ingredientName)
      .maybeSingle();

    if (existingIngredient) {
      return existingIngredient.id;
    }

    // Create new ingredient
    const { data: newIngredient, error: createError } = await supabase
      .from('ingredients')
      .insert({
        user_id: user.id,
        name: ingredientName,
        in_pantry: false,
        need_to_buy: false,
      })
      .select()
      .single();

    if (createError) {
      // Handle race condition - ingredient might have been created by another request
      if (createError.code === '23505') {
        const { data: retryIngredient } = await supabase
          .from('ingredients')
          .select('id')
          .eq('user_id', user.id)
          .eq('name', ingredientName)
          .single();

        if (retryIngredient) {
          return retryIngredient.id;
        }
      }
      throw new Error(`Failed to create ingredient: ${createError.message}`);
    }

    return newIngredient.id;
  },

  /**
   * Get all user's ingredients (for full list display)
   * @returns Array of all ingredients ordered by name
   * @throws Error if database error occurs
   */
  async getAllIngredients(): Promise<Ingredient[]> {
    const { data, error } = await supabase
      .from('ingredients')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch ingredients: ${error.message}`);
    }

    return data.map(item => ({
      id: item.id,
      name: item.name,
      inPantry: item.in_pantry,
      needToBuy: item.need_to_buy,
      updatedAt: item.updated_at,
    }));
  },

  /**
   * Update the need_to_buy status of an ingredient
   * @param ingredientId - Ingredient UUID
   * @param needToBuy - New need_to_buy status
   * @throws Error if database error occurs
   */
  async updateNeedToBuy(ingredientId: string, needToBuy: boolean): Promise<void> {
    if (!ingredientId) {
      throw new Error('Ingredient ID is required');
    }

    const { error } = await supabase
      .from('ingredients')
      .update({ need_to_buy: needToBuy })
      .eq('id', ingredientId);

    if (error) {
      throw new Error(`Failed to update ingredient: ${error.message}`);
    }
  },

  /**
   * Clear all items from shopping list (set need_to_buy to false for all user's ingredients)
   * @throws Error if not authenticated or database error occurs
   */
  async clearShoppingList(): Promise<void> {
    // Verify user is authenticated
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('Not authenticated. Please log in.');
    }

    const { error } = await supabase
      .from('ingredients')
      .update({ need_to_buy: false })
      .eq('user_id', user.id)
      .eq('need_to_buy', true);

    if (error) {
      throw new Error(`Failed to clear shopping list: ${error.message}`);
    }
  },
};
