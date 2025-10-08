import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { TouchableOpacity, Alert } from 'react-native';
import { useAuth } from '../hooks/useAuth';

// Import screens
import RecipesListScreen from '../screens/recipes/RecipesListScreen';
import RecipeDetailScreen from '../screens/recipes/RecipeDetailScreen';
import AddRecipeScreen from '../screens/recipes/AddRecipeScreen';
import EditRecipeScreen from '../screens/recipes/EditRecipeScreen';
import GroceryListsScreen from '../screens/grocery/GroceryListsScreen';
import GroceryListDetailScreen from '../screens/grocery/GroceryListDetailScreen';
import ShoppingListScreen from '../screens/grocery/ShoppingListScreen';

// Navigation type definitions
export type RecipesStackParamList = {
  RecipesList: undefined;
  RecipeDetail: { recipeId: string };
  AddRecipe: undefined;
  EditRecipe: { recipeId: string };
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
  Lists: undefined;
  Shopping: undefined;
};

const Tab = createBottomTabNavigator<RootTabParamList>();
const RecipesStack = createNativeStackNavigator<RecipesStackParamList>();
const GroceryStack = createNativeStackNavigator<GroceryStackParamList>();
const ShoppingStack = createNativeStackNavigator<ShoppingStackParamList>();

/**
 * Recipes Stack Navigator
 * Contains: RecipesList -> RecipeDetail, AddRecipe, EditRecipe
 */
function RecipesNavigator() {
  const { signOut } = useAuth();

  async function handleSignOut(): Promise<void> {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          try {
            await signOut();
          } catch (error) {
            Alert.alert('Error', 'Failed to sign out');
          }
        },
      },
    ]);
  }

  return (
    <RecipesStack.Navigator>
      <RecipesStack.Screen
        name="RecipesList"
        component={RecipesListScreen}
        options={{
          title: 'My Recipes',
          headerRight: () => (
            <TouchableOpacity
              onPress={handleSignOut}
              style={{
                padding: 8,
                marginRight: 8,
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <MaterialCommunityIcons name="logout" size={24} color="#D97706" />
            </TouchableOpacity>
          ),
        }}
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
          name="Lists"
          component={GroceryNavigator}
          options={{
            tabBarIcon: ({ color, size }) => (
              <MaterialCommunityIcons name="format-list-checks" size={size} color={color} />
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
