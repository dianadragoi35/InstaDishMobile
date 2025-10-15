import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useGenerateRecipe } from '../../hooks/useRecipeGeneration';
import { useRecipes } from '../../hooks/useRecipes';
import { RecipesStackParamList } from '../../navigation/AppNavigator';
import { ParseRecipeResponse } from '../../types';

type NavigationProp = NativeStackNavigationProp<RecipesStackParamList, 'GenerateRecipe'>;

const GenerateRecipeScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const [ingredientsText, setIngredientsText] = useState('');
  const [cuisine, setCuisine] = useState('');
  const [language, setLanguage] = useState('English');

  const { mutate: generateRecipe, data: generatedRecipeData, isLoading, error, reset } = useGenerateRecipe();
  const { createRecipeAsync, isCreating } = useRecipes();

  // Use local state for the generated recipe so we can edit it
  const [generatedRecipe, setGeneratedRecipe] = useState<ParseRecipeResponse | null>(null);

  // Update local state when query data changes
  React.useEffect(() => {
    if (generatedRecipeData) {
      setGeneratedRecipe(generatedRecipeData);
    }
  }, [generatedRecipeData]);

  const handleGenerate = () => {
    if (!ingredientsText.trim()) {
      return;
    }

    generateRecipe({
      ingredientsText: ingredientsText.trim(),
      options: {
        cuisine: cuisine.trim() || undefined,
        language: language.trim() || 'English',
      },
    });
  };

  const handleSaveRecipe = async () => {
    if (!generatedRecipe) return;

    try {
      await createRecipeAsync({
        recipeName: generatedRecipe.recipeName,
        instructions: generatedRecipe.instructions,
        prepTime: generatedRecipe.prepTime || '',
        cookTime: generatedRecipe.cookTime || '',
        servings: generatedRecipe.servings || '',
        ingredients: generatedRecipe.ingredients,
      });

      // Navigate back to recipes list
      navigation.navigate('RecipesList');
    } catch (error) {
      console.error('Failed to save recipe:', error);
    }
  };

  const handleStartOver = () => {
    reset();
    setGeneratedRecipe(null);
    setIngredientsText('');
    setCuisine('');
    setLanguage('English');
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {!generatedRecipe && !isLoading && (
        <>
          <Text style={styles.title}>Generate AI Recipe</Text>
          <Text style={styles.subtitle}>
            Tell us what ingredients you have, and we'll create a delicious recipe for you!
          </Text>

          <View style={styles.section}>
            <Text style={styles.label}>Ingredients *</Text>
            <TextInput
              style={styles.textArea}
              multiline
              numberOfLines={4}
              value={ingredientsText}
              onChangeText={setIngredientsText}
              placeholder="e.g., chicken, rice, tomatoes, garlic"
              textAlignVertical="top"
            />
            <Text style={styles.hint}>Separate ingredients with commas</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Preferred Cuisine (optional)</Text>
            <TextInput
              style={styles.input}
              value={cuisine}
              onChangeText={setCuisine}
              placeholder="e.g., Italian, Mexican, Thai"
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Language</Text>
            <TextInput
              style={styles.input}
              value={language}
              onChangeText={setLanguage}
              placeholder="English"
            />
          </View>

          {error && (
            <View style={styles.errorCard}>
              <Text style={styles.errorText}>
                {error.message || 'Failed to generate recipe. Please try again.'}
              </Text>
            </View>
          )}

          <TouchableOpacity
            style={[styles.button, styles.generateButton, (!ingredientsText.trim() || isLoading) && styles.buttonDisabled]}
            onPress={handleGenerate}
            disabled={!ingredientsText.trim() || isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <MaterialCommunityIcons name="auto-fix" size={20} color="#fff" style={styles.buttonIcon} />
                <Text style={styles.buttonText}>Generate Recipe</Text>
              </>
            )}
          </TouchableOpacity>
        </>
      )}

      {isLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#D97706" />
          <Text style={styles.loadingText}>Creating your recipe...</Text>
          <Text style={styles.loadingSubtext}>
            Our AI chef is working on something delicious!
          </Text>
          <Text style={styles.loadingTimer}>
            This usually takes 15-30 seconds
          </Text>
        </View>
      )}

      {generatedRecipe && !isLoading && (
        <>
          <Text style={styles.title}>Review Generated Recipe</Text>
          <Text style={styles.subtitle}>Edit any field before saving</Text>

          <View style={styles.section}>
            <Text style={styles.label}>Recipe Name</Text>
            <TextInput
              style={styles.input}
              value={generatedRecipe.recipeName}
              onChangeText={(value) => setGeneratedRecipe({ ...generatedRecipe, recipeName: value })}
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Ingredients ({generatedRecipe.ingredients.length})</Text>
            {generatedRecipe.ingredients.map((ingredient, index) => (
              <View key={index} style={styles.ingredientItem}>
                <Text style={styles.ingredientText}>
                  {ingredient.quantity} {ingredient.name}
                  {ingredient.notes ? ` (${ingredient.notes})` : ''}
                </Text>
              </View>
            ))}
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Instructions</Text>
            <TextInput
              style={styles.textArea}
              multiline
              numberOfLines={6}
              value={generatedRecipe.instructions}
              onChangeText={(value) => setGeneratedRecipe({ ...generatedRecipe, instructions: value })}
              textAlignVertical="top"
            />
          </View>

          <View style={styles.row}>
            <View style={styles.halfSection}>
              <Text style={styles.label}>Prep Time</Text>
              <TextInput
                style={styles.input}
                value={generatedRecipe.prepTime || ''}
                onChangeText={(value) => setGeneratedRecipe({ ...generatedRecipe, prepTime: value })}
                placeholder="e.g., 15 min"
              />
            </View>

            <View style={styles.halfSection}>
              <Text style={styles.label}>Cook Time</Text>
              <TextInput
                style={styles.input}
                value={generatedRecipe.cookTime || ''}
                onChangeText={(value) => setGeneratedRecipe({ ...generatedRecipe, cookTime: value })}
                placeholder="e.g., 30 min"
              />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Servings</Text>
            <TextInput
              style={styles.input}
              value={generatedRecipe.servings || ''}
              onChangeText={(value) => setGeneratedRecipe({ ...generatedRecipe, servings: value })}
              placeholder="e.g., 4 servings"
            />
          </View>

          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.button, styles.secondaryButton]}
              onPress={handleStartOver}
            >
              <Text style={styles.secondaryButtonText}>Start Over</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.saveButton, isCreating && styles.buttonDisabled]}
              onPress={handleSaveRecipe}
              disabled={isCreating}
            >
              {isCreating ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Save Recipe</Text>
              )}
            </TouchableOpacity>
          </View>
        </>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  contentContainer: {
    padding: 16,
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
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
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
    minHeight: 100,
  },
  hint: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 6,
    fontStyle: 'italic',
  },
  errorCard: {
    backgroundColor: '#FEE2E2',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 14,
  },
  button: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    minHeight: 50,
  },
  generateButton: {
    backgroundColor: '#D97706',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonIcon: {
    marginRight: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    minHeight: 400,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    marginTop: 20,
  },
  loadingText: {
    marginTop: 24,
    fontSize: 22,
    fontWeight: 'bold',
    color: '#111827',
  },
  loadingSubtext: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
  loadingTimer: {
    marginTop: 8,
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  ingredientItem: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 6,
    marginBottom: 6,
  },
  ingredientText: {
    fontSize: 14,
    color: '#374151',
  },
  buttonRow: {
    flexDirection: 'row',
    marginTop: 8,
  },
  saveButton: {
    backgroundColor: '#059669',
    flex: 1,
    marginLeft: 8,
  },
  secondaryButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    flex: 1,
    marginRight: 8,
  },
  secondaryButtonText: {
    color: '#374151',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default GenerateRecipeScreen;
