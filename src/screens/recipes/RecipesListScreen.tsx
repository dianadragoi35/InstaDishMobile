import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRecipes } from '../../hooks/useRecipes';
import { RecipesStackParamList } from '../../navigation/AppNavigator';

type RecipesListScreenNavigationProp = NativeStackNavigationProp<
  RecipesStackParamList,
  'RecipesList'
>;

/**
 * Recipes List Screen
 * Shows all user recipes with search and add functionality
 */
export default function RecipesListScreen() {
  const navigation = useNavigation<RecipesListScreenNavigationProp>();
  const { recipes, isLoading, error } = useRecipes();

  const handleAddRecipe = () => {
    navigation.navigate('AddRecipe');
  };

  const handleRecipePress = (recipeId: string) => {
    navigation.navigate('RecipeDetail', { recipeId });
  };

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#D97706" />
        <Text style={styles.loadingText}>Loading recipes...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <MaterialCommunityIcons name="alert-circle" size={48} color="#EF4444" />
        <Text style={styles.errorText}>Failed to load recipes</Text>
        <Text style={styles.errorSubtext}>{error.message}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {recipes.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons name="book-open-variant" size={64} color="#D1D5DB" />
          <Text style={styles.emptyText}>No recipes yet</Text>
          <Text style={styles.emptySubtext}>Tap the + button to add your first recipe</Text>
        </View>
      ) : (
        <FlatList
          data={recipes}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.recipeCard}
              onPress={() => handleRecipePress(item.id)}
            >
              <View style={styles.recipeContent}>
                <Text style={styles.recipeName} numberOfLines={2}>
                  {item.recipeName}
                </Text>
                <View style={styles.recipeMetaRow}>
                  {item.prepTime && (
                    <View style={styles.metaItem}>
                      <MaterialCommunityIcons name="clock-outline" size={14} color="#6B7280" />
                      <Text style={styles.metaText}>Prep: {item.prepTime}</Text>
                    </View>
                  )}
                  {item.cookTime && (
                    <View style={styles.metaItem}>
                      <MaterialCommunityIcons name="fire" size={14} color="#6B7280" />
                      <Text style={styles.metaText}>Cook: {item.cookTime}</Text>
                    </View>
                  )}
                  {item.servings && (
                    <View style={styles.metaItem}>
                      <MaterialCommunityIcons name="account-group" size={14} color="#6B7280" />
                      <Text style={styles.metaText}>{item.servings}</Text>
                    </View>
                  )}
                </View>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={24} color="#D1D5DB" />
            </TouchableOpacity>
          )}
        />
      )}

      {/* Floating Action Button */}
      <TouchableOpacity style={styles.fab} onPress={handleAddRecipe}>
        <MaterialCommunityIcons name="plus" size={24} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B7280',
  },
  errorText: {
    marginTop: 12,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  errorSubtext: {
    marginTop: 4,
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  emptySubtext: {
    marginTop: 8,
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  listContainer: {
    padding: 16,
  },
  recipeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  recipeContent: {
    flex: 1,
  },
  recipeName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  recipeMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: '#6B7280',
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#D97706',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
});
