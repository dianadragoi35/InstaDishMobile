import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import * as Brightness from 'expo-brightness';
import * as Asset from 'expo-asset';
import { RecipesStackParamList } from '../../navigation/AppNavigator';
import { RecipeStep } from '../../types';
import StepCard from '../../components/StepCard';
import ProgressIndicator from '../../components/ProgressIndicator';
import { useUserPreferences } from '../../hooks/useUserPreferences';
import { narrateStep, stopNarration, isSpeaking } from '../../services/narrationService';
import { CookingCharacter } from '../../components/cooking/CookingCharacter';
import { useCharacterAnimation } from '../../hooks/useCharacterAnimation';
import { CharacterAnimation, ANIMATION_SOURCES } from '../../types/character';
import { useTimer } from '../../contexts/TimerContext';
import { TimerStatus } from '../../contexts/TimerContext';

type CookingModeScreenRouteProp = RouteProp<RecipesStackParamList, 'CookingMode'>;
type CookingModeScreenNavigationProp = NativeStackNavigationProp<
  RecipesStackParamList,
  'CookingMode'
>;

/**
 * Cooking Mode Screen
 * Kitchen-optimized full-screen interface for step-by-step cooking instructions
 * Features:
 * - Tap left/right sides of screen to navigate
 * - Full-screen layout with hidden nav bars
 * - Large, readable step instructions (28pt)
 * - Auto-brightness boost for kitchen visibility
 * - High contrast white background with dark text
 * - Screen stay-awake during cooking
 */
export default function CookingModeScreen() {
  const route = useRoute<CookingModeScreenRouteProp>();
  const navigation = useNavigation<CookingModeScreenNavigationProp>();
  const { recipeId, steps } = route.params;
  const { preferences } = useUserPreferences();
  const { getTimer } = useTimer();

  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isNarrating, setIsNarrating] = useState(false);

  // Current step derived from index
  const currentStep = steps[currentStepIndex];

  // Character animation management
  const {
    currentAnimation,
    setAnimation,
    playOneShot,
    resetToIdle,
  } = useCharacterAnimation();

  // Hide status bar for immersive experience
  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: false,
    });
  }, [navigation]);

  // Keep screen awake during cooking mode
  useEffect(() => {
    activateKeepAwakeAsync();

    return () => {
      deactivateKeepAwake();
    };
  }, []);

  // Cleanup narration on unmount
  useEffect(() => {
    return () => {
      stopNarration();
      resetToIdle(); // Reset character animation on unmount
    };
  }, [resetToIdle]);

  // Auto-increase brightness for better visibility in kitchen
  useEffect(() => {
    let previousBrightness: number | undefined;

    const setupBrightness = async () => {
      try {
        // Save current brightness level
        previousBrightness = await Brightness.getBrightnessAsync();
        // Set to maximum brightness for kitchen visibility
        await Brightness.setBrightnessAsync(1.0);
      } catch (error) {
        console.warn('Failed to adjust brightness:', error);
        // Brightness permission errors are non-critical, continue without brightness control
      }
    };

    setupBrightness();

    return () => {
      // Restore previous brightness when exiting cooking mode
      if (previousBrightness !== undefined) {
        Brightness.setBrightnessAsync(previousBrightness).catch((error) => {
          console.warn('Failed to restore brightness:', error);
        });
      }
    };
  }, []);

  /**
   * Preload character animations for smooth transitions
   */
  useEffect(() => {
    const preloadAnimations = async () => {
      try {
        // Preload all animation assets
        const animationAssets = Object.values(ANIMATION_SOURCES).map((source) =>
          Asset.Asset.fromModule(source)
        );
        await Promise.all(animationAssets.map((asset) => asset.downloadAsync()));
      } catch (error) {
        console.warn('Failed to preload character animations:', error);
        // Non-critical error, character will still work but may have slight delay on first use
      }
    };

    preloadAnimations();
  }, []);

  /**
   * Sync character animation with actual speech status (polling)
   * This ensures chef-talking only shows when voice is actively speaking
   */
  useEffect(() => {
    let pollInterval: NodeJS.Timeout | null = null;

    const checkSpeakingStatus = async () => {
      const speaking = await isSpeaking();
      const isOnFinalStep = currentStepIndex === steps.length - 1;

      if (speaking) {
        // Voice is actively speaking - show talking animation
        setAnimation(CharacterAnimation.Speaking);
      } else if (isOnFinalStep) {
        // On final step and not speaking - show celebration
        setAnimation(CharacterAnimation.Celebration);
      } else {
        // Default idle animation
        setAnimation(CharacterAnimation.Idle);
      }
    };

    // Check immediately
    checkSpeakingStatus();

    // Poll speaking status every 100ms for smooth transitions
    pollInterval = setInterval(checkSpeakingStatus, 100);

    return () => {
      if (pollInterval) {
        clearInterval(pollInterval);
      }
    };
  }, [currentStepIndex, steps.length, setAnimation]);

  /**
   * Monitor timer status and trigger alert animation on completion
   */
  useEffect(() => {
    const timerId = `${recipeId}-${currentStepIndex}`;
    const timer = getTimer(timerId);

    if (timer && timer.status === TimerStatus.COMPLETED) {
      // Play timer alert animation when timer completes
      playOneShot(CharacterAnimation.TimerAlert, 5000);
    }
  }, [recipeId, currentStepIndex, getTimer, playOneShot]);

  /**
   * Auto-narrate step when it changes (if enabled in preferences)
   */
  useEffect(() => {
    const autoNarrateStep = async () => {
      if (preferences?.autoNarrate && currentStep) {
        try {
          setIsNarrating(true);
          await narrateStep(
            currentStep.instruction,
            preferences.recipeLanguage,
            preferences.narrationSpeed
          );
          setIsNarrating(false);
        } catch (error) {
          console.error('Auto-narration failed:', error);
          setIsNarrating(false);
        }
      }
    };

    autoNarrateStep();
  }, [currentStepIndex, currentStep, preferences?.autoNarrate, preferences?.recipeLanguage, preferences?.narrationSpeed]);

  /**
   * Handle manual narration button press
   */
  const handleNarrate = useCallback(async () => {
    try {
      const speaking = await isSpeaking();

      if (speaking) {
        // Stop if currently speaking
        await stopNarration();
        setIsNarrating(false);
      } else {
        // Start narration
        setIsNarrating(true);
        const step = steps[currentStepIndex];
        await narrateStep(
          step.instruction,
          preferences?.recipeLanguage || 'en',
          preferences?.narrationSpeed || 1.0
        );
        setIsNarrating(false);
      }
    } catch (error) {
      console.error('Narration failed:', error);
      setIsNarrating(false);
    }
  }, [steps, currentStepIndex, preferences]);

  /**
   * Navigate to next step
   */
  const goToNextStep = useCallback(async () => {
    if (currentStepIndex < steps.length - 1) {
      await stopNarration();
      setIsNarrating(false);
      setCurrentStepIndex(currentStepIndex + 1);
      // Note: Celebration animation now handled by useEffect based on step position
    }
  }, [currentStepIndex, steps.length]);

  /**
   * Navigate to previous step
   */
  const goToPreviousStep = useCallback(async () => {
    if (currentStepIndex > 0) {
      await stopNarration();
      setIsNarrating(false);

      // Reset to idle immediately when going backwards
      // (useEffect will set correct animation based on destination step)
      resetToIdle();

      setCurrentStepIndex(currentStepIndex - 1);
    }
  }, [currentStepIndex, resetToIdle]);

  /**
   * Exit cooking mode and return to recipe detail
   */
  const exitCookingMode = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  /**
   * Handle tap on left side of screen (go to previous step)
   */
  const handleLeftTap = () => {
    if (currentStepIndex > 0) {
      goToPreviousStep();
    }
  };

  /**
   * Handle tap on right side of screen (go to next step)
   */
  const handleRightTap = () => {
    if (currentStepIndex < steps.length - 1) {
      goToNextStep();
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar hidden />

      {/* Progress Indicator */}
      <ProgressIndicator
        currentStep={currentStepIndex + 1}
        totalSteps={steps.length}
      />

      {/* Exit Button */}
      <TouchableOpacity style={styles.exitButton} onPress={exitCookingMode}>
        <MaterialCommunityIcons name="close" size={28} color="#111827" />
      </TouchableOpacity>

      {/* Narration Button */}
      <TouchableOpacity
        style={styles.narrateButton}
        onPress={handleNarrate}
        disabled={isNarrating}
      >
        {isNarrating ? (
          <ActivityIndicator size="small" color="#D97706" />
        ) : (
          <MaterialCommunityIcons
            name="volume-high"
            size={28}
            color="#D97706"
          />
        )}
      </TouchableOpacity>

      {/* Main Content */}
      <View style={styles.contentContainer}>
          {/* Tap Zones */}
          <View style={styles.tapZonesContainer}>
            {/* Left Tap Zone */}
            <TouchableOpacity
              style={styles.leftTapZone}
              onPress={handleLeftTap}
              activeOpacity={1}
            />

            {/* Step Card in Center */}
            <View style={styles.stepCardContainer}>
              <StepCard
                recipeId={recipeId}
                step={currentStep}
                stepIndex={currentStepIndex}
                stepNumber={currentStepIndex + 1}
                totalSteps={steps.length}
                renderCharacter={() => (
                  <CookingCharacter
                    currentAnimation={currentAnimation}
                    position="inline"
                    size={100}
                  />
                )}
              />
            </View>

            {/* Right Tap Zone */}
            <TouchableOpacity
              style={styles.rightTapZone}
              onPress={handleRightTap}
              activeOpacity={1}
            />
          </View>

        {/* Navigation Hint on First Load */}
        {currentStepIndex === 0 && (
          <View style={styles.hintContainer}>
            <Text style={styles.hintText}>Tap left or right edge to navigate</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF', // Pure white for maximum contrast
  },
  exitButton: {
    position: 'absolute',
    top: 70,
    left: 20,
    zIndex: 10,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  narrateButton: {
    position: 'absolute',
    top: 70,
    right: 20,
    zIndex: 10,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#FCD34D',
  },
  contentContainer: {
    flex: 1,
  },
  tapZonesContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  leftTapZone: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 80,
    justifyContent: 'center',
    alignItems: 'flex-start',
    zIndex: 1,
  },
  stepCardContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  rightTapZone: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 80,
    justifyContent: 'center',
    alignItems: 'flex-end',
    zIndex: 1,
  },
  hintContainer: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  hintText: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
  },
});
