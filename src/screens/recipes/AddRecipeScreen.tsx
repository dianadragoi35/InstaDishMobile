import React, { useState } from 'react';
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
import { Picker } from '@react-native-picker/picker';
import { useNavigation } from '@react-navigation/native';
import { aiParsingService } from '../../services/aiParsingService';
import { useRecipes } from '../../hooks/useRecipes';
import { ParseRecipeResponse } from '../../types';

export default function AddRecipeScreen() {
  const navigation = useNavigation();
  const { createRecipeAsync } = useRecipes();

  // Input state
  const [recipeText, setRecipeText] = useState('');
  const [language, setLanguage] = useState('English');

  // Parsing state
  const [isParsing, setIsParsing] = useState(false);
  const [parsedRecipe, setParsedRecipe] = useState<ParseRecipeResponse | null>(null);

  // Saving state
  const [isSaving, setIsSaving] = useState(false);

  // Handle recipe parsing
  const handleParse = async () => {
    if (!recipeText.trim()) {
      Alert.alert('Error', 'Please paste some recipe text first');
      return;
    }

    setIsParsing(true);
    try {
      const result = await aiParsingService.parseRecipe({
        recipeText,
        language,
      });

      setParsedRecipe(result);
    } catch (error) {
      Alert.alert(
        'Parsing Failed',
        error instanceof Error ? error.message : 'Failed to parse recipe. Please try again.'
      );
    } finally {
      setIsParsing(false);
    }
  };

  // Handle recipe save
  const handleSave = async () => {
    if (!parsedRecipe) return;

    setIsSaving(true);
    try {
      await createRecipeAsync({
        recipeName: parsedRecipe.recipeName,
        ingredients: parsedRecipe.ingredients,
        instructions: parsedRecipe.instructions,
        prepTime: parsedRecipe.prepTime,
        cookTime: parsedRecipe.cookTime,
        servings: parsedRecipe.servings,
      });

      Alert.alert('Success', 'Recipe saved successfully!', [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error) {
      Alert.alert(
        'Save Failed',
        error instanceof Error ? error.message : 'Failed to save recipe. Please try again.'
      );
    } finally {
      setIsSaving(false);
    }
  };

  // Update parsed recipe fields
  const updateRecipeName = (value: string) => {
    if (parsedRecipe) {
      setParsedRecipe({ ...parsedRecipe, recipeName: value });
    }
  };

  const updateInstructions = (value: string) => {
    if (parsedRecipe) {
      setParsedRecipe({ ...parsedRecipe, instructions: value });
    }
  };

  const updatePrepTime = (value: string) => {
    if (parsedRecipe) {
      setParsedRecipe({ ...parsedRecipe, prepTime: value });
    }
  };

  const updateCookTime = (value: string) => {
    if (parsedRecipe) {
      setParsedRecipe({ ...parsedRecipe, cookTime: value });
    }
  };

  const updateServings = (value: string) => {
    if (parsedRecipe) {
      setParsedRecipe({ ...parsedRecipe, servings: value });
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {!parsedRecipe ? (
        <>
          {/* Recipe Input Section */}
          <Text style={styles.title}>Add New Recipe</Text>
          <Text style={styles.subtitle}>Paste your recipe text below and let AI parse it for you</Text>

          <View style={styles.section}>
            <Text style={styles.label}>Recipe Text</Text>
            <TextInput
              style={styles.textArea}
              multiline
              numberOfLines={10}
              value={recipeText}
              onChangeText={setRecipeText}
              placeholder="Paste your recipe here..."
              textAlignVertical="top"
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Language</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={language}
                onValueChange={(value) => setLanguage(value)}
                style={styles.picker}
              >
                <Picker.Item label="English" value="English" />
                <Picker.Item label="Spanish" value="Spanish" />
                <Picker.Item label="French" value="French" />
                <Picker.Item label="German" value="German" />
                <Picker.Item label="Italian" value="Italian" />
              </Picker>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.button, styles.parseButton, isParsing && styles.buttonDisabled]}
            onPress={handleParse}
            disabled={isParsing}
          >
            {isParsing ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Parse Recipe</Text>
            )}
          </TouchableOpacity>
        </>
      ) : (
        <>
          {/* Parsed Recipe Preview & Edit Section */}
          <Text style={styles.title}>Review Parsed Recipe</Text>
          <Text style={styles.subtitle}>Edit any field before saving</Text>

          <View style={styles.section}>
            <Text style={styles.label}>Recipe Name</Text>
            <TextInput
              style={styles.input}
              value={parsedRecipe.recipeName}
              onChangeText={updateRecipeName}
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Ingredients ({parsedRecipe.ingredients.length})</Text>
            {parsedRecipe.ingredients.map((ingredient, index) => (
              <View key={index} style={styles.ingredientItem}>
                <Text style={styles.ingredientText}>
                  {ingredient.quantity} {ingredient.name}
                  {ingredient.notes && ` (${ingredient.notes})`}
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
              value={parsedRecipe.instructions}
              onChangeText={updateInstructions}
              textAlignVertical="top"
            />
          </View>

          <View style={styles.row}>
            <View style={styles.halfSection}>
              <Text style={styles.label}>Prep Time</Text>
              <TextInput
                style={styles.input}
                value={parsedRecipe.prepTime}
                onChangeText={updatePrepTime}
                placeholder="e.g., 15 min"
              />
            </View>

            <View style={styles.halfSection}>
              <Text style={styles.label}>Cook Time</Text>
              <TextInput
                style={styles.input}
                value={parsedRecipe.cookTime}
                onChangeText={updateCookTime}
                placeholder="e.g., 30 min"
              />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Servings</Text>
            <TextInput
              style={styles.input}
              value={parsedRecipe.servings}
              onChangeText={updateServings}
              placeholder="e.g., 4 servings"
            />
          </View>

          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.button, styles.secondaryButton]}
              onPress={() => setParsedRecipe(null)}
            >
              <Text style={styles.secondaryButtonText}>Back to Edit</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.saveButton, isSaving && styles.buttonDisabled]}
              onPress={handleSave}
              disabled={isSaving}
            >
              {isSaving ? (
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
}

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
    marginBottom: 24,
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
    minHeight: 120,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    overflow: 'hidden',
  },
  picker: {
    height: 50,
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
  button: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
  },
  parseButton: {
    backgroundColor: '#D97706',
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
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButtonText: {
    color: '#374151',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonRow: {
    flexDirection: 'row',
    marginTop: 8,
  },
});
