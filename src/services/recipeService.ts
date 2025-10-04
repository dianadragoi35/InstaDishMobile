import { supabase } from './supabase';
import { Recipe, CreateRecipeRequest, RecipeIngredient, UpdateRecipeRequest } from '../types';

/**
 * Recipe Service
 * Handles all recipe-related database operations using Supabase
 */
export const recipeService = {
  /**
   * Get all recipes for the current authenticated user
   * @returns Array of recipes ordered by creation date (newest first)
   * @throws Error if not authenticated or database error occurs
   */
  async getRecipes(): Promise<Recipe[]> {
    const { data, error } = await supabase
      .from('recipes')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch recipes: ${error.message}`);
    }

    return data.map(recipe => ({
      id: recipe.id,
      recipeName: recipe.recipe_name,
      instructions: recipe.instructions,
      prepTime: recipe.prep_time || '',
      cookTime: recipe.cook_time || '',
      servings: recipe.servings || '',
      imageUrl: recipe.image_url,
      createdAt: recipe.created_at,
      updatedAt: recipe.updated_at,
    }));
  },

  /**
   * Get a single recipe by ID
   * @param id - Recipe UUID
   * @returns Recipe object or null if not found
   * @throws Error if database error occurs
   */
  async getRecipeById(id: string): Promise<Recipe | null> {
    if (!id) {
      throw new Error('Recipe ID is required');
    }

    const { data, error } = await supabase
      .from('recipes')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Not found
      }
      throw new Error(`Failed to fetch recipe: ${error.message}`);
    }

    if (!data) return null;

    return {
      id: data.id,
      recipeName: data.recipe_name,
      instructions: data.instructions,
      prepTime: data.prep_time || '',
      cookTime: data.cook_time || '',
      servings: data.servings || '',
      imageUrl: data.image_url,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  },

  /**
   * Get all ingredients for a specific recipe with junction table data
   * @param recipeId - Recipe UUID
   * @returns Array of recipe ingredients with linked ingredient data
   * @throws Error if database error occurs
   */
  async getRecipeIngredients(recipeId: string): Promise<Array<RecipeIngredient & { ingredient: { id: string; name: string } }>> {
    if (!recipeId) {
      throw new Error('Recipe ID is required');
    }

    const { data, error } = await supabase
      .from('recipe_ingredients')
      .select(`
        id,
        recipe_id,
        ingredient_id,
        quantity,
        notes,
        ingredient:ingredients(id, name)
      `)
      .eq('recipe_id', recipeId);

    if (error) {
      throw new Error(`Failed to fetch recipe ingredients: ${error.message}`);
    }

    return data.map(item => ({
      id: item.id,
      recipeId: item.recipe_id,
      ingredientId: item.ingredient_id,
      quantity: item.quantity || '',
      notes: item.notes,
      ingredient: {
        id: item.ingredient.id,
        name: item.ingredient.name,
      },
    }));
  },

  /**
   * Create a new recipe with ingredients
   * Handles creating/finding ingredients and linking them via junction table
   * @param request - Recipe creation request with ingredients
   * @returns Created recipe ID
   * @throws Error if not authenticated or database error occurs
   */
  async createRecipe(request: CreateRecipeRequest): Promise<string> {
    // Verify user is authenticated
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('Not authenticated. Please log in to create recipes.');
    }

    // Validate required fields
    if (!request.recipeName?.trim()) {
      throw new Error('Recipe name is required');
    }
    if (!request.instructions?.trim()) {
      throw new Error('Recipe instructions are required');
    }

    // Create the recipe
    const { data: recipe, error: recipeError } = await supabase
      .from('recipes')
      .insert({
        user_id: user.id,
        recipe_name: request.recipeName.trim(),
        instructions: request.instructions.trim(),
        prep_time: request.prepTime?.trim() || null,
        cook_time: request.cookTime?.trim() || null,
        servings: request.servings?.trim() || null,
        image_url: request.imageUrl?.trim() || null,
      })
      .select()
      .single();

    if (recipeError) {
      throw new Error(`Failed to create recipe: ${recipeError.message}`);
    }

    // Process ingredients if provided
    if (request.ingredients && request.ingredients.length > 0) {
      for (const ingredient of request.ingredients) {
        if (!ingredient.name?.trim()) {
          continue; // Skip empty ingredient names
        }

        const ingredientName = ingredient.name.trim();

        // Find existing ingredient or create new one
        const { data: existingIngredient } = await supabase
          .from('ingredients')
          .select('id')
          .eq('user_id', user.id)
          .eq('name', ingredientName)
          .maybeSingle();

        let ingredientId: string;

        if (existingIngredient) {
          ingredientId = existingIngredient.id;
        } else {
          // Create new ingredient
          const { data: newIngredient, error: ingredientError } = await supabase
            .from('ingredients')
            .insert({
              user_id: user.id,
              name: ingredientName,
              in_pantry: false,
              need_to_buy: false,
            })
            .select()
            .single();

          if (ingredientError) {
            // If duplicate error, try to fetch it again (race condition)
            if (ingredientError.code === '23505') {
              const { data: retryIngredient } = await supabase
                .from('ingredients')
                .select('id')
                .eq('user_id', user.id)
                .eq('name', ingredientName)
                .single();

              if (retryIngredient) {
                ingredientId = retryIngredient.id;
              } else {
                throw new Error(`Failed to create ingredient "${ingredientName}": ${ingredientError.message}`);
              }
            } else {
              throw new Error(`Failed to create ingredient "${ingredientName}": ${ingredientError.message}`);
            }
          } else {
            ingredientId = newIngredient.id;
          }
        }

        // Link ingredient to recipe via junction table
        const { error: junctionError } = await supabase
          .from('recipe_ingredients')
          .insert({
            recipe_id: recipe.id,
            ingredient_id: ingredientId,
            quantity: ingredient.quantity?.trim() || null,
            notes: ingredient.notes?.trim() || null,
          });

        if (junctionError) {
          // If it's a duplicate, ignore it (ingredient already linked)
          if (junctionError.code !== '23505') {
            throw new Error(`Failed to link ingredient "${ingredientName}" to recipe: ${junctionError.message}`);
          }
        }
      }
    }

    return recipe.id;
  },

  /**
   * Update an existing recipe's basic details
   * Note: This does NOT update ingredients. Use separate methods for ingredient management.
   * @param id - Recipe UUID
   * @param updates - Partial recipe updates
   * @throws Error if database error occurs
   */
  async updateRecipe(id: string, updates: UpdateRecipeRequest): Promise<void> {
    if (!id) {
      throw new Error('Recipe ID is required');
    }

    if (Object.keys(updates).length === 0) {
      return; // No updates to apply
    }

    const updateData: any = {};

    if (updates.recipeName !== undefined) {
      updateData.recipe_name = updates.recipeName?.trim() || null;
    }
    if (updates.instructions !== undefined) {
      updateData.instructions = updates.instructions?.trim() || null;
    }
    if (updates.prepTime !== undefined) {
      updateData.prep_time = updates.prepTime?.trim() || null;
    }
    if (updates.cookTime !== undefined) {
      updateData.cook_time = updates.cookTime?.trim() || null;
    }
    if (updates.servings !== undefined) {
      updateData.servings = updates.servings?.trim() || null;
    }
    if (updates.imageUrl !== undefined) {
      updateData.image_url = updates.imageUrl?.trim() || null;
    }

    const { error } = await supabase
      .from('recipes')
      .update(updateData)
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to update recipe: ${error.message}`);
    }
  },

  /**
   * Delete a recipe
   * Cascade deletes will automatically remove recipe_ingredients junction records
   * @param id - Recipe UUID
   * @throws Error if database error occurs
   */
  async deleteRecipe(id: string): Promise<void> {
    if (!id) {
      throw new Error('Recipe ID is required');
    }

    const { error } = await supabase
      .from('recipes')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to delete recipe: ${error.message}`);
    }
  },

  /**
   * Search recipes by name using case-insensitive pattern matching
   * @param query - Search query string
   * @returns Array of matching recipes ordered by creation date (newest first)
   * @throws Error if database error occurs
   */
  async searchRecipes(query: string): Promise<Recipe[]> {
    if (!query?.trim()) {
      // If empty query, return all recipes
      return this.getRecipes();
    }

    const searchQuery = query.trim();

    const { data, error } = await supabase
      .from('recipes')
      .select('*')
      .ilike('recipe_name', `%${searchQuery}%`)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to search recipes: ${error.message}`);
    }

    return data.map(recipe => ({
      id: recipe.id,
      recipeName: recipe.recipe_name,
      instructions: recipe.instructions,
      prepTime: recipe.prep_time || '',
      cookTime: recipe.cook_time || '',
      servings: recipe.servings || '',
      imageUrl: recipe.image_url,
      createdAt: recipe.created_at,
      updatedAt: recipe.updated_at,
    }));
  },
};
