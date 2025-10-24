import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Switch,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import Slider from '@react-native-community/slider';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../hooks/useAuth';
import { useUserPreferences } from '../../hooks/useUserPreferences';
import { LANGUAGE_OPTIONS } from '../../services/userPreferencesService';

/**
 * Account Screen
 * Shows user profile information, preferences, and sign out option
 */
export default function AccountScreen() {
  const { user, signOut } = useAuth();
  const { preferences, isLoading, updatePreferences, isUpdating } = useUserPreferences();
  const [selectedLanguage, setSelectedLanguage] = useState<string>(
    preferences?.recipeLanguage || 'en'
  );
  const [autoNarrate, setAutoNarrate] = useState<boolean>(
    preferences?.autoNarrate || false
  );
  const [narrationSpeed, setNarrationSpeed] = useState<number>(
    preferences?.narrationSpeed || 1.0
  );

  // Update state when preferences load
  React.useEffect(() => {
    if (preferences) {
      setSelectedLanguage(preferences.recipeLanguage);
      setAutoNarrate(preferences.autoNarrate);
      setNarrationSpeed(preferences.narrationSpeed);
    }
  }, [preferences]);

  const handleLanguageChange = (languageCode: string) => {
    setSelectedLanguage(languageCode);
    updatePreferences({ recipeLanguage: languageCode });
  };

  const handleAutoNarrateChange = (value: boolean) => {
    setAutoNarrate(value);
    updatePreferences({ autoNarrate: value });
  };

  const handleNarrationSpeedChange = (value: number) => {
    setNarrationSpeed(value);
  };

  const handleNarrationSpeedComplete = (value: number) => {
    updatePreferences({ narrationSpeed: value });
  };

  const handleSignOut = async () => {
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
  };

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#D97706" />
        <Text style={styles.loadingText}>Loading preferences...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Profile Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <MaterialCommunityIcons name="account-circle" size={24} color="#D97706" />
          <Text style={styles.sectionTitle}>Profile</Text>
        </View>
        <View style={styles.card}>
          <View style={styles.profileRow}>
            <Text style={styles.label}>Email</Text>
            <Text style={styles.value}>{user?.email || 'Not available'}</Text>
          </View>
        </View>
      </View>

      {/* Preferences Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <MaterialCommunityIcons name="cog" size={24} color="#D97706" />
          <Text style={styles.sectionTitle}>Preferences</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.label}>Default Recipe Language</Text>
          <Text style={styles.helperText}>
            AI-generated recipes will use this language
          </Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={selectedLanguage}
              onValueChange={handleLanguageChange}
              style={styles.picker}
              enabled={!isUpdating}
            >
              {LANGUAGE_OPTIONS.map((option) => (
                <Picker.Item
                  key={option.code}
                  label={option.label}
                  value={option.code}
                />
              ))}
            </Picker>
            {isUpdating && (
              <ActivityIndicator
                size="small"
                color="#D97706"
                style={styles.pickerLoader}
              />
            )}
          </View>

          {/* Narration Settings */}
          <View style={styles.divider} />

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.label}>Auto-narrate Steps</Text>
              <Text style={styles.helperText}>
                Automatically read each step aloud in cooking mode
              </Text>
            </View>
            <Switch
              value={autoNarrate}
              onValueChange={handleAutoNarrateChange}
              trackColor={{ false: '#E5E7EB', true: '#FCD34D' }}
              thumbColor={autoNarrate ? '#D97706' : '#F3F4F6'}
              disabled={isUpdating}
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.settingColumn}>
            <Text style={styles.label}>Narration Speed</Text>
            <Text style={styles.helperText}>
              Adjust how fast the instructions are read ({narrationSpeed.toFixed(1)}x)
            </Text>
            <View style={styles.sliderContainer}>
              <Text style={styles.sliderLabel}>0.5x</Text>
              <Slider
                style={styles.slider}
                minimumValue={0.5}
                maximumValue={1.5}
                step={0.1}
                value={narrationSpeed}
                onValueChange={handleNarrationSpeedChange}
                onSlidingComplete={handleNarrationSpeedComplete}
                minimumTrackTintColor="#D97706"
                maximumTrackTintColor="#E5E7EB"
                thumbTintColor="#D97706"
                disabled={isUpdating}
              />
              <Text style={styles.sliderLabel}>1.5x</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Actions Section */}
      <View style={styles.section}>
        <TouchableOpacity
          style={styles.signOutButton}
          onPress={handleSignOut}
        >
          <MaterialCommunityIcons name="logout" size={20} color="#EF4444" />
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>

      {/* App Info */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>InstaDish v1.0.0</Text>
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
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  profileRow: {
    gap: 4,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  value: {
    fontSize: 16,
    color: '#111827',
  },
  helperText: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 12,
    marginTop: 4,
  },
  pickerContainer: {
    position: 'relative',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    backgroundColor: '#F9FAFB',
    marginTop: 4,
    overflow: 'hidden',
  },
  picker: {
    height: 216,
    width: '100%',
  },
  pickerLoader: {
    position: 'absolute',
    right: 12,
    top: 15,
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 16,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  settingInfo: {
    flex: 1,
  },
  settingColumn: {
    gap: 4,
  },
  sliderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  slider: {
    flex: 1,
    height: 40,
  },
  sliderLabel: {
    fontSize: 12,
    color: '#6B7280',
    width: 35,
    textAlign: 'center',
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    gap: 8,
    borderWidth: 1,
    borderColor: '#FEE2E2',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  signOutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#EF4444',
  },
  footer: {
    marginTop: 32,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#9CA3AF',
  },
});
