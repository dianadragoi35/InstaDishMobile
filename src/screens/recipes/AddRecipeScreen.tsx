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
import { MaterialIcons, Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { aiParsingService } from '../../services/aiParsingService';
import { youtubeService } from '../../services/youtubeService';
import { websiteService } from '../../services/websiteService';
import { useRecipes } from '../../hooks/useRecipes';
import { ParseRecipeResponse } from '../../types';

type InputTab = 'text' | 'youtube' | 'website';

export default function AddRecipeScreen() {
  const navigation = useNavigation();
  const { createRecipeAsync } = useRecipes();

  // Tab state
  const [activeTab, setActiveTab] = useState<InputTab>('website');

  // Input state
  const [recipeText, setRecipeText] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [language, setLanguage] = useState('English');

  // Parsing state
  const [isParsing, setIsParsing] = useState(false);
  const [parsedRecipe, setParsedRecipe] = useState<ParseRecipeResponse | null>(null);

  // Saving state
  const [isSaving, setIsSaving] = useState(false);

  // Handle recipe text parsing
  const handleParseText = async () => {
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

  // Handle YouTube video parsing
  const handleParseYoutube = async () => {
    if (!youtubeUrl.trim()) {
      Alert.alert('Error', 'Please paste a YouTube URL first');
      return;
    }

    if (!youtubeService.isValidYouTubeUrl(youtubeUrl)) {
      Alert.alert('Error', 'Invalid YouTube URL format. Please paste a valid YouTube video URL.');
      return;
    }

    setIsParsing(true);
    try {
      const result = await youtubeService.extractRecipeFromYouTubeVideo(youtubeUrl, language);

      if (!result.success || !result.recipe) {
        Alert.alert(
          'Extraction Failed',
          result.error || 'Failed to extract recipe from video. Please try another video.'
        );
        return;
      }

      setParsedRecipe(result.recipe);
    } catch (error) {
      Alert.alert(
        'Extraction Failed',
        error instanceof Error ? error.message : 'Failed to extract recipe from YouTube video. Please try again.'
      );
    } finally {
      setIsParsing(false);
    }
  };

  // Handle website URL parsing
  const handleParseWebsite = async () => {
    if (!websiteUrl.trim()) {
      Alert.alert('Error', 'Please paste a website URL first');
      return;
    }

    if (!websiteService.isValidWebsiteUrl(websiteUrl)) {
      Alert.alert('Error', 'Invalid website URL format. Please paste a valid URL starting with http:// or https://');
      return;
    }

    setIsParsing(true);
    try {
      const result = await websiteService.extractRecipeFromWebsite(websiteUrl, language);

      if (!result.success || !result.recipe) {
        Alert.alert(
          'Extraction Failed',
          result.error || 'Failed to extract recipe from website. Please try another website.'
        );
        return;
      }

      setParsedRecipe(result.recipe);
    } catch (error) {
      Alert.alert(
        'Extraction Failed',
        error instanceof Error ? error.message : 'Failed to extract recipe from website. Please try again.'
      );
    } finally {
      setIsParsing(false);
    }
  };

  // Handle parse based on active tab
  const handleParse = () => {
    if (activeTab === 'text') {
      handleParseText();
    } else if (activeTab === 'youtube') {
      handleParseYoutube();
    } else if (activeTab === 'website') {
      handleParseWebsite();
    }
  };

  /**
   * Normalize instructions text:
   * 1. Insert newlines before numbered steps (if missing)
   * 2. Strip leading numbers (1., 2., 1), 2), etc.)
   * 3. Ensure each step is on a new line
   * 4. Remove empty lines
   */
  const normalizeInstructions = (text: string): string => {
    // First, insert newlines before numbered patterns if they're missing
    // This handles: "1. Step one 2. Step two" -> "1. Step one\n2. Step two"
    let normalized = text.replace(/\s+(\d+[\.\)])\s+/g, '\n$1 ');

    // Now split by newlines, clean up, and remove leading numbers
    return normalized
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .map(line => {
        // Remove leading numbers like "1. ", "2) ", "3. ", etc.
        return line.replace(/^\d+[\.\)]\s*/, '');
      })
      .join('\n');
  };

  // Handle recipe save
  const handleSave = async () => {
    if (!parsedRecipe) return;

    setIsSaving(true);
    try {
      const normalizedInstructions = normalizeInstructions(parsedRecipe.instructions);

      await createRecipeAsync({
        recipeName: parsedRecipe.recipeName,
        ingredients: parsedRecipe.ingredients,
        instructions: normalizedInstructions,
        prepTime: parsedRecipe.prepTime,
        cookTime: parsedRecipe.cookTime,
        servings: parsedRecipe.servings,
        imageUrl: parsedRecipe.imageUrl,
        steps: parsedRecipe.steps,
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
      {!parsedRecipe && !isParsing && (
        <>
          {/* Recipe Input Section */}
          <Text style={styles.title}>Add New Recipe</Text>
          <Text style={styles.subtitle}>Select your preferred import method</Text>

          {/* Tab Navigation */}
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'website' && styles.activeTab]}
              onPress={() => setActiveTab('website')}
            >
              <FontAwesome5
                name="link"
                size={18}
                color={activeTab === 'website' ? '#D97706' : '#6B7280'}
              />
              <Text style={[styles.tabText, activeTab === 'website' && styles.activeTabText]}>
                URL
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'youtube' && styles.activeTab]}
              onPress={() => setActiveTab('youtube')}
            >
              <Ionicons
                name="logo-youtube"
                size={20}
                color={activeTab === 'youtube' ? '#D97706' : '#6B7280'}
              />
              <Text style={[styles.tabText, activeTab === 'youtube' && styles.activeTabText]}>
                Video
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'text' && styles.activeTab]}
              onPress={() => setActiveTab('text')}
            >
              <MaterialIcons
                name="description"
                size={20}
                color={activeTab === 'text' ? '#D97706' : '#6B7280'}
              />
              <Text style={[styles.tabText, activeTab === 'text' && styles.activeTabText]}>
                Text
              </Text>
            </TouchableOpacity>
          </View>

          {/* Tab Content */}
          {activeTab === 'website' && (
            <View style={styles.section}>
              <Text style={styles.label}>Website URL</Text>
              <TextInput
                style={styles.input}
                value={websiteUrl}
                onChangeText={setWebsiteUrl}
                placeholder="https://www.example.com/recipe..."
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="url"
              />
              <Text style={styles.hint}>
                Paste a link to any recipe website or blog post
              </Text>
            </View>
          )}

          {activeTab === 'youtube' && (
            <View style={styles.section}>
              <Text style={styles.label}>YouTube Video URL</Text>
              <TextInput
                style={styles.input}
                value={youtubeUrl}
                onChangeText={setYoutubeUrl}
                placeholder="https://www.youtube.com/watch?v=..."
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="url"
              />
              <Text style={styles.hint}>
                Paste a link to a cooking video with captions/transcripts enabled
              </Text>
            </View>
          )}

          {activeTab === 'text' && (
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
          )}

          <View style={styles.section}>
            <Text style={styles.label}>Language</Text>
            <Picker
              selectedValue={language}
              onValueChange={(value) => setLanguage(value)}
            >
              <Picker.Item label="English" value="English" />
              <Picker.Item label="Romanian" value="Romanian" />
              <Picker.Item label='Dutch' value='Dutch' />
              <Picker.Item label="Spanish" value="Spanish" />
              <Picker.Item label="French" value="French" />
              <Picker.Item label="German" value="German" />
              <Picker.Item label="Italian" value="Italian" />
            </Picker>
          </View>

          <TouchableOpacity
            style={[styles.button, styles.parseButton, isParsing && styles.buttonDisabled]}
            onPress={handleParse}
            disabled={isParsing}
          >
            {isParsing ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>
                {activeTab === 'youtube'
                  ? 'Extract Recipe from Video'
                  : activeTab === 'website'
                  ? 'Extract Recipe from Website'
                  : 'Parse Recipe'}
              </Text>
            )}
          </TouchableOpacity>
        </>
      )}

      {isParsing && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#D97706" />
          <Text style={styles.loadingText}>
            {activeTab === 'youtube'
              ? 'Extracting recipe from video...'
              : activeTab === 'website'
              ? 'Extracting recipe from website...'
              : 'Parsing recipe...'}
          </Text>
          <Text style={styles.loadingSubtext}>
            This may take a few moments
          </Text>
        </View>
      )}

      {parsedRecipe && !isParsing && (
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
    marginBottom: 16,
  },
  tabContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  activeTab: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  activeTabText: {
    color: '#D97706',
    fontWeight: '600',
  },
  hint: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 6,
    fontStyle: 'italic',
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
    // Removed custom container to follow canonical iOS Picker usage
  },
  picker: {
    // Removed explicit height; rely on platform defaults
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
});
