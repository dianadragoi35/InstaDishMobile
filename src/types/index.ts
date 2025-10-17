// Core Recipe types
export interface RecipeStep {
  instruction: string;
  time?: string | null;
  imageUrl?: string | null;
}

export interface Recipe {
  id: string;
  recipeName: string;
  instructions: string;
  prepTime: string;
  cookTime: string;
  servings: string;
  imageUrl?: string;
  sourceUrl?: string;
  steps?: RecipeStep[] | null;
  createdAt: string;
  updatedAt: string;
}

export interface Ingredient {
  id: string;
  name: string;
  inPantry: boolean;
  needToBuy: boolean;
  updatedAt: string;
}

export interface RecipeIngredient {
  id: string;
  recipeId: string;
  ingredientId: string;
  quantity: string;
  notes?: string;
}

export interface GroceryList {
  id: string;
  name: string;
  status: 'Active' | 'Completed' | 'Archived';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface GroceryListItem {
  id: string;
  groceryListId: string;
  ingredientId: string;
  isPurchased: boolean;
  quantity?: string;
  notes?: string;
}

// API Request/Response types
export interface ParseRecipeRequest {
  recipeText: string;
  language?: string;
}

export interface ParseRecipeResponse {
  recipeName: string;
  instructions: string;
  prepTime: string;
  cookTime: string;
  servings: string;
  steps?: RecipeStep[];
  ingredients: Array<{
    name: string;
    quantity: string;
    notes?: string;
  }>;
}

export interface CreateRecipeRequest {
  recipeName: string;
  instructions: string;
  prepTime?: string;
  cookTime?: string;
  servings?: string;
  imageUrl?: string;
  sourceUrl?: string;
  steps?: RecipeStep[];
  ingredients: Array<{
    name: string;
    quantity: string;
    notes?: string;
  }>;
}

export interface UpdateRecipeRequest {
  recipeName?: string;
  instructions?: string;
  prepTime?: string;
  cookTime?: string;
  servings?: string;
  imageUrl?: string;
  sourceUrl?: string;
  steps?: RecipeStep[];
  ingredients?: Array<{
    name: string;
    quantity: string;
    notes?: string;
  }>;
}

export interface CreateGroceryListRequest {
  name: string;
  notes?: string;
  ingredientIds?: string[];
}

export interface UpdateGroceryListRequest {
  name?: string;
  status?: 'Active' | 'Completed' | 'Archived';
  notes?: string;
}

export interface AddGroceryListItemRequest {
  ingredientId: string;
  quantity?: string;
  notes?: string;
}

// Extended types with related data (for UI display)
export interface RecipeWithIngredients extends Recipe {
  ingredients: Array<RecipeIngredient & { ingredient: Ingredient }>;
}

export interface GroceryListWithItems extends GroceryList {
  items: Array<GroceryListItem & { ingredient: Ingredient }>;
}

// Navigation types
export type RootStackParamList = {
  Recipes: undefined;
  RecipesList: undefined;
  RecipeDetail: { recipeId: string };
  AddRecipe: undefined;
  EditRecipe: { recipeId: string };
  GroceryLists: undefined;
  GroceryListDetail: { listId: string };
  CreateGroceryList: undefined;
  Shopping: undefined;
  ShoppingList: undefined;
  Auth: undefined;
};

// Auth types
export interface User {
  id: string;
  email: string;
  createdAt: string;
}

export interface AuthSession {
  user: User;
  accessToken: string;
  refreshToken: string;
}
