import { supabase } from './supabase';
import { GroceryList, GroceryListItem, Ingredient } from '../types';

type GroceryItemResponse = {
  id: string;
  grocery_list_id: string;
  ingredient_id: string;
  is_purchased: boolean;
  quantity: string | null;
  notes: string | null;
  ingredient: {
    id: string;
    name: string;
    in_pantry: boolean;
    need_to_buy: boolean;
    updated_at: string;
  };
};

/**
 * Grocery List Service
 * Handles all grocery list and shopping list operations using Supabase
 */
export const groceryService = {
  /**
   * Get all grocery lists for the current authenticated user
   * @returns Array of grocery lists ordered by creation date (newest first)
   * @throws Error if not authenticated or database error occurs
   */
  async getGroceryLists(): Promise<GroceryList[]> {
    const { data, error } = await supabase
      .from('grocery_lists')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch grocery lists: ${error.message}`);
    }

    return data.map(list => ({
      id: list.id,
      name: list.name,
      status: list.status,
      notes: list.notes,
      createdAt: list.created_at,
      updatedAt: list.updated_at,
    }));
  },

  /**
   * Get all items for a specific grocery list with ingredient details
   * @param listId - Grocery list UUID
   * @returns Array of grocery list items with linked ingredient data
   * @throws Error if database error occurs
   */
  async getGroceryListItems(listId: string): Promise<Array<GroceryListItem & { ingredient: Ingredient }>> {
    if (!listId) {
      throw new Error('Grocery list ID is required');
    }

    const { data, error } = await supabase
      .from('grocery_list_items')
      .select(`
        id,
        grocery_list_id,
        ingredient_id,
        is_purchased,
        quantity,
        notes,
        ingredient:ingredients!inner(
          id,
          name,
          in_pantry,
          need_to_buy,
          updated_at
        )
      `)
      .eq('grocery_list_id', listId);

    if (error) {
      throw new Error(`Failed to fetch grocery list items: ${error.message}`);
    }

    // Type assertion for nested response
    const typedData = data as unknown as GroceryItemResponse[];

    return typedData.map(item => ({
      id: item.id,
      groceryListId: item.grocery_list_id,
      ingredientId: item.ingredient_id,
      isPurchased: item.is_purchased,
      quantity: item.quantity || undefined,
      notes: item.notes || undefined,
      ingredient: {
        id: item.ingredient.id,
        name: item.ingredient.name,
        inPantry: item.ingredient.in_pantry,
        needToBuy: item.ingredient.need_to_buy,
        updatedAt: item.ingredient.updated_at,
      },
    }));
  },

  /**
   * Create a new grocery list
   * @param name - Name of the grocery list
   * @param notes - Optional notes for the list
   * @returns Created grocery list ID
   * @throws Error if not authenticated or database error occurs
   */
  async createGroceryList(name: string, notes?: string): Promise<string> {
    // Verify user is authenticated
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('Not authenticated. Please log in to create grocery lists.');
    }

    // Validate required fields
    if (!name?.trim()) {
      throw new Error('Grocery list name is required');
    }

    const { data, error } = await supabase
      .from('grocery_lists')
      .insert({
        user_id: user.id,
        name: name.trim(),
        notes: notes?.trim() || null,
        status: 'Active',
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create grocery list: ${error.message}`);
    }

    return data.id;
  },

  /**
   * Add an ingredient to a grocery list
   * @param listId - Grocery list UUID
   * @param ingredientId - Ingredient UUID
   * @param quantity - Optional quantity
   * @param notes - Optional notes
   * @throws Error if database error occurs
   */
  async addItemToList(
    listId: string,
    ingredientId: string,
    quantity?: string,
    notes?: string
  ): Promise<void> {
    if (!listId) {
      throw new Error('Grocery list ID is required');
    }
    if (!ingredientId) {
      throw new Error('Ingredient ID is required');
    }

    const { error } = await supabase
      .from('grocery_list_items')
      .insert({
        grocery_list_id: listId,
        ingredient_id: ingredientId,
        quantity: quantity?.trim() || null,
        notes: notes?.trim() || null,
        is_purchased: false,
      });

    if (error) {
      // Handle duplicate constraint (item already in list)
      if (error.code === '23505') {
        throw new Error('This ingredient is already in the grocery list');
      }
      throw new Error(`Failed to add item to grocery list: ${error.message}`);
    }
  },

  /**
   * Toggle the purchased status of a grocery list item
   * @param itemId - Grocery list item UUID
   * @param isPurchased - New purchased status
   * @throws Error if database error occurs
   */
  async toggleItemPurchased(itemId: string, isPurchased: boolean): Promise<void> {
    if (!itemId) {
      throw new Error('Grocery list item ID is required');
    }

    const { error } = await supabase
      .from('grocery_list_items')
      .update({ is_purchased: isPurchased })
      .eq('id', itemId);

    if (error) {
      throw new Error(`Failed to update item status: ${error.message}`);
    }
  },

  /**
   * Update the status of a grocery list
   * @param listId - Grocery list UUID
   * @param status - New status (Active, Completed, or Archived)
   * @throws Error if database error occurs
   */
  async updateListStatus(listId: string, status: 'Active' | 'Completed' | 'Archived'): Promise<void> {
    if (!listId) {
      throw new Error('Grocery list ID is required');
    }

    if (!['Active', 'Completed', 'Archived'].includes(status)) {
      throw new Error('Invalid status. Must be Active, Completed, or Archived');
    }

    const { error } = await supabase
      .from('grocery_lists')
      .update({ status })
      .eq('id', listId);

    if (error) {
      throw new Error(`Failed to update list status: ${error.message}`);
    }
  },

  /**
   * Delete a grocery list
   * Cascade deletes will automatically remove all grocery_list_items
   * @param listId - Grocery list UUID
   * @throws Error if database error occurs
   */
  async deleteGroceryList(listId: string): Promise<void> {
    if (!listId) {
      throw new Error('Grocery list ID is required');
    }

    const { error } = await supabase
      .from('grocery_lists')
      .delete()
      .eq('id', listId);

    if (error) {
      throw new Error(`Failed to delete grocery list: ${error.message}`);
    }
  },

  /**
   * Get all ingredients marked as "need to buy" (Shopping List view)
   * This is a user-wide view of ingredients they need to purchase
   * @returns Array of ingredients marked for purchase
   * @throws Error if database error occurs
   */
  async getShoppingListItems(): Promise<Ingredient[]> {
    const { data, error } = await supabase
      .from('ingredients')
      .select('*')
      .eq('need_to_buy', true)
      .order('name', { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch shopping list items: ${error.message}`);
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
   * Remove an item from a grocery list
   * @param itemId - Grocery list item UUID
   * @throws Error if database error occurs
   */
  async removeItemFromList(itemId: string): Promise<void> {
    if (!itemId) {
      throw new Error('Grocery list item ID is required');
    }

    const { error } = await supabase
      .from('grocery_list_items')
      .delete()
      .eq('id', itemId);

    if (error) {
      throw new Error(`Failed to remove item from list: ${error.message}`);
    }
  },

  /**
   * Update a grocery list's basic details
   * @param listId - Grocery list UUID
   * @param updates - Fields to update
   * @throws Error if database error occurs
   */
  async updateGroceryList(
    listId: string,
    updates: { name?: string; notes?: string }
  ): Promise<void> {
    if (!listId) {
      throw new Error('Grocery list ID is required');
    }

    if (Object.keys(updates).length === 0) {
      return; // No updates to apply
    }

    const updateData: any = {};

    if (updates.name !== undefined) {
      if (!updates.name?.trim()) {
        throw new Error('Grocery list name cannot be empty');
      }
      updateData.name = updates.name.trim();
    }

    if (updates.notes !== undefined) {
      updateData.notes = updates.notes?.trim() || null;
    }

    const { error } = await supabase
      .from('grocery_lists')
      .update(updateData)
      .eq('id', listId);

    if (error) {
      throw new Error(`Failed to update grocery list: ${error.message}`);
    }
  },
};
