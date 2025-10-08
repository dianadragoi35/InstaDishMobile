import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { recipeService } from '../../services/recipeService';
import { useRecipes } from '../../hooks/useRecipes';
import { RecipesStackParamList } from '../../navigation/AppNavigator';

type EditRecipeScreenRouteProp = RouteProp<RecipesStackParamList, 'EditRecipe'>;
type EditRecipeScreenNavigationProp = NativeStackNavigationProp<
  RecipesStackParamList,
  'EditRecipe'
>;

/**
 * Edit Recipe Screen
 * Allows users to edit existing recipes with pre-populated form data
 */
export default function EditRecipeScreen() {
  const route = useRoute<EditRecipeScreenRouteProp>();
  const navigation = useNavigation<EditRecipeScreenNavigationProp>();
  const queryClient = useQueryClient();
  const { recipeId } = route.params;
  const { updateRecipeAsync } = useRecipes();

  // Form state
  const [recipeName, setRecipeName] = useState('');
  const [instructions, setInstructions] = useState('');
  const [prepTime, setPrepTime] = useState('');
  const [cookTime, setCookTime] = useState('');
  const [servings, setServings] = useState('');
  const [ingredients, setIngredients] = useState<Array<{ name: string; quantity: string; notes?: string }>>([]);
  const [isSaving, setIsSaving] = useState(false);

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
    data: recipeIngredients = [],
    isLoading: isLoadingIngredients,
  } = useQuery({
    queryKey: ['recipeIngredients', recipeId],
    queryFn: () => recipeService.getRecipeIngredients(recipeId),
  });

  // Pre-populate form when data loads
  useEffect(() => {
    if (recipe) {
      setRecipeName(recipe.recipeName);
      setInstructions(recipe.instructions);
      setPrepTime(recipe.prepTime || '');
      setCookTime(recipe.cookTime || '');
      setServings(recipe.servings || '');
    }
  }, [recipe]);

  // Pre-populate ingredients when data loads
  useEffect(() => {
    if (recipeIngredients.length > 0) {
      setIngredients(
        recipeIngredients.map((item) => ({
          name: item.ingredient.name,
          quantity: item.quantity,
          notes: item.notes,
        }))
      );
    }
  }, [recipeIngredients]);

  /**
   * Handle save recipe updates
   */
  const handleSave = async () => {
    // Validation
    if (!recipeName.trim()) {
      Alert.alert('Error', 'Recipe name is required');
      return;
    }

    if (!instructions.trim()) {
      Alert.alert('Error', 'Instructions are required');
      return;
    }

    if (ingredients.length === 0) {
      Alert.alert('Warning', 'Are you sure you want to save this recipe without ingredients?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Save Anyway', onPress: () => performSave() },
      ]);
      return;
    }

    performSave();
  };

  const performSave = async () => {
    setIsSaving(true);
    try {
      await updateRecipeAsync({
        id: recipeId,
        updates: {
          recipeName,
          instructions,
          prepTime: prepTime.trim() || undefined,
          cookTime: cookTime.trim() || undefined,
          servings: servings.trim() || undefined,
          ingredients,
        },
      });

      // Invalidate recipe queries
      queryClient.invalidateQueries({ queryKey: ['recipe', recipeId] });
      queryClient.invalidateQueries({ queryKey: ['recipeIngredients', recipeId] });
      queryClient.invalidateQueries({ queryKey: ['recipes'] });

      Alert.alert('Success', 'Recipe updated successfully!', [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error) {
      Alert.alert(
        'Save Failed',
        error instanceof Error ? error.message : 'Failed to update recipe. Please try again.'
      );
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * Handle adding a new ingredient row
   */
  const handleAddIngredient = () => {
    setIngredients([...ingredients, { name: '', quantity: '', notes: '' }]);
  };

  /**
   * Handle removing an ingredient
   */
  const handleRemoveIngredient = (index: number) => {
    const updated = ingredients.filter((_, i) => i !== index);
    setIngredients(updated);
  };

  /**
   * Handle updating an ingredient field
   */
  const handleUpdateIngredient = (
    index: number,
    field: 'name' | 'quantity' | 'notes',
    value: string
  ) => {
    const updated = [...ingredients];
    updated[index] = { ...updated[index], [field]: value };
    setIngredients(updated);
  };

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
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.retryButtonText}>Go Back</Text>
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
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.retryButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Text style={styles.title}>Edit Recipe</Text>
      <Text style={styles.subtitle}>Update recipe details and ingredients</Text>

      {/* Recipe Name */}
      <View style={styles.section}>
        <Text style={styles.label}>
          Recipe Name <Text style={styles.required}>*</Text>
        </Text>
        <TextInput
          style={styles.input}
          value={recipeName}
          onChangeText={setRecipeName}
          placeholder="Enter recipe name"
        />
      </View>

      {/* Instructions */}
      <View style={styles.section}>
        <Text style={styles.label}>
          Instructions <Text style={styles.required}>*</Text>
        </Text>
        <TextInput
          style={styles.textArea}
          multiline
          numberOfLines={6}
          value={instructions}
          onChangeText={setInstructions}
          placeholder="Enter cooking instructions..."
          textAlignVertical="top"
        />
      </View>

      {/* Metadata Row */}
      <View style={styles.row}>
        <View style={styles.halfSection}>
          <Text style={styles.label}>Prep Time</Text>
          <TextInput
            style={styles.input}
            value={prepTime}
            onChangeText={setPrepTime}
            placeholder="e.g., 15 min"
          />
        </View>

        <View style={styles.halfSection}>
          <Text style={styles.label}>Cook Time</Text>
          <TextInput
            style={styles.input}
            value={cookTime}
            onChangeText={setCookTime}
            placeholder="e.g., 30 min"
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Servings</Text>
        <TextInput
          style={styles.input}
          value={servings}
          onChangeText={setServings}
          placeholder="e.g., 4 servings"
        />
      </View>

      {/* Ingredients Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.label}>Ingredients ({ingredients.length})</Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={handleAddIngredient}
          >
            <MaterialCommunityIcons name="plus-circle" size={24} color="#D97706" />
            <Text style={styles.addButtonText}>Add</Text>
          </TouchableOpacity>
        </View>

        {ingredients.length === 0 ? (
          <View style={styles.emptySection}>
            <Text style={styles.emptySectionText}>No ingredients added</Text>
            <TouchableOpacity
              style={styles.addFirstButton}
              onPress={handleAddIngredient}
            >
              <Text style={styles.addFirstButtonText}>Add First Ingredient</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {ingredients.map((ingredient, index) => (
              <View key={index} style={styles.ingredientRow}>
                <View style={styles.ingredientInputs}>
                  <TextInput
                    style={[styles.input, styles.ingredientNameInput]}
                    value={ingredient.name}
                    onChangeText={(value) => handleUpdateIngredient(index, 'name', value)}
                    placeholder="Ingredient name"
                  />
                  <TextInput
                    style={[styles.input, styles.ingredientQuantityInput]}
                    value={ingredient.quantity}
                    onChangeText={(value) => handleUpdateIngredient(index, 'quantity', value)}
                    placeholder="Qty"
                  />
                  <TextInput
                    style={[styles.input, styles.ingredientNotesInput]}
                    value={ingredient.notes || ''}
                    onChangeText={(value) => handleUpdateIngredient(index, 'notes', value)}
                    placeholder="Notes (optional)"
                  />
                </View>
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => handleRemoveIngredient(index)}
                >
                  <MaterialCommunityIcons name="close-circle" size={24} color="#EF4444" />
                </TouchableOpacity>
              </View>
            ))}
          </>
        )}
      </View>

      {/* Action Buttons */}
      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={[styles.button, styles.cancelButton]}
          onPress={() => navigation.goBack()}
          disabled={isSaving}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.saveButton, isSaving && styles.buttonDisabled]}
          onPress={handleSave}
          disabled={isSaving}
        >
          {isSaving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Save Changes</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  contentContainer: {
    padding: 16,
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
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
  },
  section: {
    marginBottom: 20,
  },
  halfSection: {
    flex: 1,
    marginHorizontal: 4,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  required: {
    color: '#EF4444',
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
    minHeight: 120,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  addButtonText: {
    fontSize: 14,
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
    marginBottom: 12,
  },
  addFirstButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  addFirstButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#D97706',
  },
  ingredientRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    gap: 8,
  },
  ingredientInputs: {
    flex: 1,
    gap: 8,
  },
  ingredientNameInput: {
    marginBottom: 0,
  },
  ingredientQuantityInput: {
    marginBottom: 0,
  },
  ingredientNotesInput: {
    marginBottom: 0,
  },
  removeButton: {
    padding: 4,
    marginTop: 4,
  },
  button: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
    flex: 1,
  },
  saveButton: {
    backgroundColor: '#059669',
    marginLeft: 8,
  },
  cancelButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    marginRight: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButtonText: {
    color: '#374151',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonRow: {
    flexDirection: 'row',
    marginTop: 8,
  },
});
