import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Share,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { recipeService } from '../../services/recipeService';
import { ingredientService } from '../../services/ingredientService';
import { RecipesStackParamList } from '../../navigation/AppNavigator';

type RecipeDetailScreenRouteProp = RouteProp<RecipesStackParamList, 'RecipeDetail'>;
type RecipeDetailScreenNavigationProp = NativeStackNavigationProp<
  RecipesStackParamList,
  'RecipeDetail'
>;

/**
 * Recipe Detail Screen
 * Displays full recipe information with ingredients, instructions, and actions
 */
export default function RecipeDetailScreen() {
  const route = useRoute<RecipeDetailScreenRouteProp>();
  const navigation = useNavigation<RecipeDetailScreenNavigationProp>();
  const queryClient = useQueryClient();
  const { recipeId } = route.params;

  const [isDeleting, setIsDeleting] = useState(false);
  const [isAddingToShoppingList, setIsAddingToShoppingList] = useState(false);

  // Fetch recipe data
  const {
    data: recipe,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['recipe', recipeId],
    queryFn: () => recipeService.getRecipeById(recipeId),
  });

  // Fetch recipe ingredients
  const {
    data: ingredients = [],
    isLoading: isLoadingIngredients,
  } = useQuery({
    queryKey: ['recipeIngredients', recipeId],
    queryFn: () => recipeService.getRecipeIngredients(recipeId),
  });

  /**
   * Handle delete recipe with confirmation
   */
  const handleDelete = () => {
    Alert.alert(
      'Delete Recipe',
      'Are you sure you want to delete this recipe? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsDeleting(true);
              await recipeService.deleteRecipe(recipeId);

              // Invalidate recipes list cache
              queryClient.invalidateQueries({ queryKey: ['recipes'] });

              // Navigate back
              navigation.goBack();

              // Show success message
              Alert.alert('Success', 'Recipe deleted successfully');
            } catch (err) {
              console.error('Failed to delete recipe:', err);
              Alert.alert(
                'Error',
                err instanceof Error ? err.message : 'Failed to delete recipe'
              );
            } finally {
              setIsDeleting(false);
            }
          },
        },
      ]
    );
  };

  /**
   * Handle edit recipe
   * Navigate to EditRecipeScreen
   */
  const handleEdit = () => {
    navigation.navigate('EditRecipe', { recipeId });
  };

  /**
   * Handle share recipe using native share sheet
   */
  const handleShare = async () => {
    if (!recipe) return;

    try {
      const ingredientsList = ingredients
        .map((ing) => `• ${ing.quantity} ${ing.ingredient.name}${ing.notes ? ` (${ing.notes})` : ''}`)
        .join('\n');

      const instructions = recipe.instructions
        .split('\n')
        .filter((step) => step.trim())
        .map((step, index) => `${index + 1}. ${step}`)
        .join('\n');

      const shareMessage = `${recipe.recipeName}\n\n` +
        `${recipe.prepTime ? `Prep Time: ${recipe.prepTime}\n` : ''}` +
        `${recipe.cookTime ? `Cook Time: ${recipe.cookTime}\n` : ''}` +
        `${recipe.servings ? `Servings: ${recipe.servings}\n` : ''}` +
        `\nIngredients:\n${ingredientsList}\n\n` +
        `Instructions:\n${instructions}`;

      await Share.share({
        message: shareMessage,
        title: recipe.recipeName,
      });
    } catch (err) {
      console.error('Failed to share recipe:', err);
    }
  };

  /**
   * Handle add all recipe ingredients to shopping list
   */
  const handleAddToShoppingList = async () => {
    if (!ingredients || ingredients.length === 0) {
      Alert.alert('No Ingredients', 'This recipe has no ingredients to add to the shopping list.');
      return;
    }

    Alert.alert(
      'Add to Shopping List',
      `Add all ${ingredients.length} ingredients to your shopping list?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Add All',
          onPress: async () => {
            try {
              setIsAddingToShoppingList(true);

              // Update all ingredients to mark as need_to_buy
              await Promise.all(
                ingredients.map((item) =>
                  ingredientService.updateNeedToBuy(item.ingredient.id, true)
                )
              );

              // Invalidate shopping list cache to refresh
              queryClient.invalidateQueries({ queryKey: ['shoppingList'] });

              Alert.alert(
                'Success',
                `${ingredients.length} ${ingredients.length === 1 ? 'ingredient' : 'ingredients'} added to shopping list!`
              );
            } catch (err) {
              console.error('Failed to add ingredients to shopping list:', err);
              Alert.alert(
                'Error',
                err instanceof Error ? err.message : 'Failed to add ingredients to shopping list'
              );
            } finally {
              setIsAddingToShoppingList(false);
            }
          },
        },
      ]
    );
  };

  // Set header buttons
  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <View style={styles.headerButtons}>
          <TouchableOpacity
            onPress={handleShare}
            style={styles.headerButton}
            disabled={!recipe}
          >
            <MaterialCommunityIcons name="share-variant" size={24} color="#D97706" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleEdit}
            style={styles.headerButton}
            disabled={!recipe}
          >
            <MaterialCommunityIcons name="pencil" size={24} color="#D97706" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleDelete}
            style={styles.headerButton}
            disabled={!recipe || isDeleting}
          >
            <MaterialCommunityIcons
              name="delete"
              size={24}
              color={isDeleting ? '#D1D5DB' : '#EF4444'}
            />
          </TouchableOpacity>
        </View>
      ),
    });
  }, [navigation, recipe, isDeleting, ingredients]);

  // Loading state
  if (isLoading || isLoadingIngredients) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#D97706" />
        <Text style={styles.loadingText}>Loading recipe...</Text>
      </View>
    );
  }

  // Error state
  if (error) {
    return (
      <View style={styles.centerContainer}>
        <MaterialCommunityIcons name="alert-circle" size={64} color="#EF4444" />
        <Text style={styles.errorText}>Failed to load recipe</Text>
        <Text style={styles.errorSubtext}>
          {error instanceof Error ? error.message : 'Unknown error'}
        </Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => queryClient.invalidateQueries({ queryKey: ['recipe', recipeId] })}
        >
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Recipe not found
  if (!recipe) {
    return (
      <View style={styles.centerContainer}>
        <MaterialCommunityIcons name="book-open-variant" size={64} color="#D1D5DB" />
        <Text style={styles.errorText}>Recipe not found</Text>
        <Text style={styles.errorSubtext}>This recipe may have been deleted</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.retryButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Parse instructions into steps
  const instructionSteps = recipe.instructions
    .split('\n')
    .filter((step) => step.trim())
    .map((step) => step.trim());

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Recipe Header */}
      <View style={styles.header}>
        <Text style={styles.recipeName}>{recipe.recipeName}</Text>

        {/* Metadata Row */}
        {(recipe.prepTime || recipe.cookTime || recipe.servings) && (
          <View style={styles.metadataRow}>
            {recipe.prepTime && (
              <View style={styles.metadataItem}>
                <MaterialCommunityIcons name="clock-outline" size={20} color="#D97706" />
                <View style={styles.metadataTextContainer}>
                  <Text style={styles.metadataLabel}>Prep</Text>
                  <Text style={styles.metadataValue}>{recipe.prepTime}</Text>
                </View>
              </View>
            )}
            {recipe.cookTime && (
              <View style={styles.metadataItem}>
                <MaterialCommunityIcons name="fire" size={20} color="#D97706" />
                <View style={styles.metadataTextContainer}>
                  <Text style={styles.metadataLabel}>Cook</Text>
                  <Text style={styles.metadataValue}>{recipe.cookTime}</Text>
                </View>
              </View>
            )}
            {recipe.servings && (
              <View style={styles.metadataItem}>
                <MaterialCommunityIcons name="account-group" size={20} color="#D97706" />
                <View style={styles.metadataTextContainer}>
                  <Text style={styles.metadataLabel}>Servings</Text>
                  <Text style={styles.metadataValue}>{recipe.servings}</Text>
                </View>
              </View>
            )}
          </View>
        )}
      </View>

      {/* Ingredients Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionHeaderLeft}>
            <MaterialCommunityIcons name="food-variant" size={24} color="#D97706" />
            <Text style={styles.sectionTitle}>Ingredients</Text>
          </View>
          {ingredients.length > 0 && (
            <TouchableOpacity
              style={styles.addToShoppingButton}
              onPress={handleAddToShoppingList}
              disabled={isAddingToShoppingList}
            >
              {isAddingToShoppingList ? (
                <ActivityIndicator size="small" color="#D97706" />
              ) : (
                <>
                  <MaterialCommunityIcons name="cart-plus" size={20} color="#D97706" />
                  <Text style={styles.addToShoppingText}>Add to Shopping List</Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>

        {ingredients.length === 0 ? (
          <View style={styles.emptySection}>
            <Text style={styles.emptySectionText}>No ingredients added</Text>
          </View>
        ) : (
          <View style={styles.ingredientsList}>
            {ingredients.map((item, index) => (
              <View key={item.id} style={styles.ingredientItem}>
                <View style={styles.ingredientBullet} />
                <View style={styles.ingredientContent}>
                  <Text style={styles.ingredientText}>
                    <Text style={styles.ingredientQuantity}>{item.quantity}</Text>
                    {' '}
                    <Text style={styles.ingredientName}>{item.ingredient.name}</Text>
                  </Text>
                  {item.notes && (
                    <Text style={styles.ingredientNotes}>({item.notes})</Text>
                  )}
                </View>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Instructions Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <MaterialCommunityIcons name="format-list-numbered" size={24} color="#D97706" />
          <Text style={styles.sectionTitle}>Instructions</Text>
        </View>

        {instructionSteps.length === 0 ? (
          <View style={styles.emptySection}>
            <Text style={styles.emptySectionText}>No instructions added</Text>
          </View>
        ) : (
          <View style={styles.instructionsList}>
            {instructionSteps.map((step, index) => (
              <View key={index} style={styles.instructionItem}>
                <View style={styles.stepNumberContainer}>
                  <Text style={styles.stepNumber}>{index + 1}</Text>
                </View>
                <Text style={styles.instructionText}>{step}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  contentContainer: {
    paddingBottom: 32,
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
  retryButton: {
    marginTop: 20,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#D97706',
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
  },
  headerButton: {
    padding: 8,
    marginLeft: 4,
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  recipeName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
  },
  metadataRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 20,
  },
  metadataItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metadataTextContainer: {
    flexDirection: 'column',
  },
  metadataLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  metadataValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  section: {
    backgroundColor: '#fff',
    marginTop: 12,
    padding: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  addToShoppingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  addToShoppingText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#D97706',
  },
  emptySection: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  emptySectionText: {
    fontSize: 14,
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
  ingredientsList: {
    gap: 12,
  },
  ingredientItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  ingredientBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#D97706',
    marginTop: 7,
  },
  ingredientContent: {
    flex: 1,
  },
  ingredientText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#111827',
  },
  ingredientQuantity: {
    fontWeight: '600',
    color: '#D97706',
  },
  ingredientName: {
    color: '#111827',
  },
  ingredientNotes: {
    fontSize: 14,
    color: '#6B7280',
    fontStyle: 'italic',
    marginTop: 2,
  },
  instructionsList: {
    gap: 16,
  },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  stepNumberContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FEF3C7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#D97706',
  },
  instructionText: {
    flex: 1,
    fontSize: 16,
    lineHeight: 24,
    color: '#111827',
    paddingTop: 4,
  },
});
