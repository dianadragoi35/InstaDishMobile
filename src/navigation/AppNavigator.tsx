import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { TouchableOpacity, Alert, View } from 'react-native';
import { useAuth } from '../hooks/useAuth';

// Import screens
import RecipesListScreen from '../screens/recipes/RecipesListScreen';
import RecipeDetailScreen from '../screens/recipes/RecipeDetailScreen';
import AddRecipeScreen from '../screens/recipes/AddRecipeScreen';
import EditRecipeScreen from '../screens/recipes/EditRecipeScreen';
import GenerateRecipeScreen from '../screens/recipes/GenerateRecipeScreen';
import CookingModeScreen from '../screens/recipes/CookingModeScreen';
import GroceryListsScreen from '../screens/grocery/GroceryListsScreen';
import GroceryListDetailScreen from '../screens/grocery/GroceryListDetailScreen';
import ShoppingListScreen from '../screens/grocery/ShoppingListScreen';
import AccountScreen from '../screens/account/AccountScreen';

// Navigation type definitions
export type RecipesStackParamList = {
  RecipesList: undefined;
  RecipeDetail: { recipeId: string };
  AddRecipe: undefined;
  EditRecipe: { recipeId: string };
  GenerateRecipe: undefined;
  CookingMode: {
    recipeId: string;
    steps: Array<{ instruction: string; time?: string | null; imageUrl?: string | null }>
  };
  Account: undefined;
};

export type GroceryStackParamList = {
  GroceryLists: undefined;
  GroceryListDetail: { listId: string };
};

export type ShoppingStackParamList = {
  ShoppingList: undefined;
};

export type RootTabParamList = {
  Recipes: undefined;
  AIGenerate: undefined;
  Shopping: undefined;
};

const Tab = createBottomTabNavigator<RootTabParamList>();
const RecipesStack = createNativeStackNavigator<RecipesStackParamList>();
const GroceryStack = createNativeStackNavigator<GroceryStackParamList>();
const ShoppingStack = createNativeStackNavigator<ShoppingStackParamList>();

/**
 * Recipes Stack Navigator
 * Contains: RecipesList -> RecipeDetail, AddRecipe, EditRecipe, Account
 */
function RecipesNavigator() {
  return (
    <RecipesStack.Navigator>
      <RecipesStack.Screen
        name="RecipesList"
        component={RecipesListScreen}
        options={({ navigation }) => ({
          title: 'My Recipes',
          headerRight: () => (
            <TouchableOpacity
              onPress={() => navigation.navigate('Account')}
              style={{
                padding: 8,
                marginRight: 8,
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <MaterialCommunityIcons name="account-circle" size={24} color="#D97706" />
            </TouchableOpacity>
          ),
        })}
      />
      <RecipesStack.Screen
        name="RecipeDetail"
        component={RecipeDetailScreen}
        options={{ title: 'Recipe' }}
      />
      <RecipesStack.Screen
        name="AddRecipe"
        component={AddRecipeScreen}
        options={{ title: 'Add Recipe' }}
      />
      <RecipesStack.Screen
        name="EditRecipe"
        component={EditRecipeScreen}
        options={{ title: 'Edit Recipe' }}
      />
      <RecipesStack.Screen
        name="CookingMode"
        component={CookingModeScreen}
        options={{
          presentation: 'fullScreenModal',
          headerShown: false,
          animation: 'slide_from_bottom',
        }}
      />
      <RecipesStack.Screen
        name="Account"
        component={AccountScreen}
        options={{ title: 'Account' }}
      />
    </RecipesStack.Navigator>
  );
}

/**
 * AI Generate Stack Navigator
 * Contains: GenerateRecipe, RecipesList, RecipeDetail, EditRecipe
 */
function AIGenerateNavigator() {
  return (
    <RecipesStack.Navigator>
      <RecipesStack.Screen
        name="GenerateRecipe"
        component={GenerateRecipeScreen}
        options={{ title: 'AI Recipe Generator' }}
      />
      <RecipesStack.Screen
        name="RecipesList"
        component={RecipesListScreen}
        options={{ title: 'My Recipes' }}
      />
      <RecipesStack.Screen
        name="RecipeDetail"
        component={RecipeDetailScreen}
        options={{ title: 'Recipe' }}
      />
      <RecipesStack.Screen
        name="EditRecipe"
        component={EditRecipeScreen}
        options={{ title: 'Edit Recipe' }}
      />
      <RecipesStack.Screen
        name="CookingMode"
        component={CookingModeScreen}
        options={{
          presentation: 'fullScreenModal',
          headerShown: false,
          animation: 'slide_from_bottom',
        }}
      />
    </RecipesStack.Navigator>
  );
}

/**
 * Grocery Lists Stack Navigator
 * Contains: GroceryLists -> GroceryListDetail
 */
function GroceryNavigator() {
  return (
    <GroceryStack.Navigator>
      <GroceryStack.Screen
        name="GroceryLists"
        component={GroceryListsScreen}
        options={{ title: 'Grocery Lists' }}
      />
      <GroceryStack.Screen
        name="GroceryListDetail"
        component={GroceryListDetailScreen}
        options={{ title: 'List Details' }}
      />
    </GroceryStack.Navigator>
  );
}

/**
 * Shopping Stack Navigator
 * Contains: ShoppingList (single screen)
 */
function ShoppingNavigator() {
  return (
    <ShoppingStack.Navigator>
      <ShoppingStack.Screen
        name="ShoppingList"
        component={ShoppingListScreen}
        options={{ title: 'Shopping List' }}
      />
    </ShoppingStack.Navigator>
  );
}

/**
 * Main App Navigator
 * Bottom Tab Navigator with 3 tabs: Recipes, Grocery Lists, Shopping
 */
export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={{
          tabBarActiveTintColor: '#D97706', // Amber-600
          tabBarInactiveTintColor: '#6B7280', // Gray-500
          headerShown: false, // Hide header for tab navigator (stack navigators have their own headers)
        }}
      >
        <Tab.Screen
          name="Recipes"
          component={RecipesNavigator}
          options={{
            tabBarIcon: ({ color, size }) => (
              <MaterialCommunityIcons name="book-open-variant" size={size} color={color} />
            ),
          }}
        />
        <Tab.Screen
          name="AIGenerate"
          component={AIGenerateNavigator}
          options={{
            tabBarLabel: 'AI Recipe',
            tabBarIcon: ({ color, size }) => (
              <MaterialCommunityIcons name="auto-fix" size={size} color={color} />
            ),
          }}
        />
        <Tab.Screen
          name="Shopping"
          component={ShoppingNavigator}
          options={{
            tabBarIcon: ({ color, size }) => (
              <MaterialCommunityIcons name="cart" size={size} color={color} />
            ),
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
