import { supabase } from './supabase';
import { UserPreferences, UpdateUserPreferencesRequest } from '../types';

/**
 * User Preferences Service
 * Manages user preferences including default recipe language
 */

/**
 * Get user preferences or create default if not exists
 * @returns User preferences
 */
export async function getUserPreferences(): Promise<UserPreferences> {
  try {
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      throw new Error('User not authenticated');
    }

    // Try to fetch existing preferences
    const { data, error } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error) {
      // If no preferences exist (PGRST116), create default preferences
      if (error.code === 'PGRST116') {
        return await createDefaultPreferences(user.id);
      }
      throw error;
    }

    // Convert snake_case to camelCase
    return {
      id: data.id,
      userId: data.user_id,
      recipeLanguage: data.recipe_language,
      autoNarrate: data.auto_narrate ?? false,
      narrationSpeed: data.narration_speed ?? 1.0,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  } catch (error) {
    console.error('Failed to get user preferences:', error);
    throw error;
  }
}

/**
 * Create default user preferences
 * @param userId - User ID
 * @returns Created user preferences
 */
async function createDefaultPreferences(userId: string): Promise<UserPreferences> {
  try {
    const { data, error } = await supabase
      .from('user_preferences')
      .insert({
        user_id: userId,
        recipe_language: 'en',
        auto_narrate: false,
        narration_speed: 1.0,
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    // Convert snake_case to camelCase
    return {
      id: data.id,
      userId: data.user_id,
      recipeLanguage: data.recipe_language,
      autoNarrate: data.auto_narrate ?? false,
      narrationSpeed: data.narration_speed ?? 1.0,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  } catch (error) {
    console.error('Failed to create default preferences:', error);
    throw error;
  }
}

/**
 * Update user preferences
 * @param updates - Preferences to update
 * @returns Updated user preferences
 */
export async function updateUserPreferences(
  updates: UpdateUserPreferencesRequest
): Promise<UserPreferences> {
  try {
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      throw new Error('User not authenticated');
    }

    // Convert camelCase to snake_case for database
    const dbUpdates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (updates.recipeLanguage !== undefined) {
      dbUpdates.recipe_language = updates.recipeLanguage;
    }
    if (updates.autoNarrate !== undefined) {
      dbUpdates.auto_narrate = updates.autoNarrate;
    }
    if (updates.narrationSpeed !== undefined) {
      dbUpdates.narration_speed = updates.narrationSpeed;
    }

    const { data, error } = await supabase
      .from('user_preferences')
      .update(dbUpdates)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    // Convert snake_case to camelCase
    return {
      id: data.id,
      userId: data.user_id,
      recipeLanguage: data.recipe_language,
      autoNarrate: data.auto_narrate ?? false,
      narrationSpeed: data.narration_speed ?? 1.0,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  } catch (error) {
    console.error('Failed to update user preferences:', error);
    throw error;
  }
}

/**
 * Language options for recipe language preference
 */
export const LANGUAGE_OPTIONS = [
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Español (Spanish)' },
  { code: 'fr', label: 'Français (French)' },
  { code: 'it', label: 'Italiano (Italian)' },
  { code: 'de', label: 'Deutsch (German)' },
  { code: 'pt', label: 'Português (Portuguese)' },
  { code: 'ru', label: 'Русский (Russian)' },
  { code: 'zh', label: '中文 (Chinese)' },
  { code: 'ja', label: '日本語 (Japanese)' },
  { code: 'ko', label: '한국어 (Korean)' },
  { code: 'ar', label: 'العربية (Arabic)' },
  { code: 'hi', label: 'हिन्दी (Hindi)' },
  { code: 'th', label: 'ไทย (Thai)' },
  { code: 'vi', label: 'Tiếng Việt (Vietnamese)' },
  { code: 'pl', label: 'Polski (Polish)' },
  { code: 'nl', label: 'Nederlands (Dutch)' },
  { code: 'tr', label: 'Türkçe (Turkish)' },
  { code: 'el', label: 'Ελληνικά (Greek)' },
  { code: 'he', label: 'עברית (Hebrew)' },
  { code: 'sv', label: 'Svenska (Swedish)' },
  { code: 'no', label: 'Norsk (Norwegian)' },
  { code: 'da', label: 'Dansk (Danish)' },
  { code: 'fi', label: 'Suomi (Finnish)' },
  { code: 'cs', label: 'Čeština (Czech)' },
  { code: 'ro', label: 'Română (Romanian)' },
  { code: 'hu', label: 'Magyar (Hungarian)' },
  { code: 'uk', label: 'Українська (Ukrainian)' },
  { code: 'id', label: 'Bahasa Indonesia (Indonesian)' },
  { code: 'ms', label: 'Bahasa Melayu (Malay)' },
];
