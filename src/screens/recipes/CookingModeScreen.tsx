import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import * as Brightness from 'expo-brightness';
import { RecipesStackParamList } from '../../navigation/AppNavigator';
import { RecipeStep } from '../../types';
import StepCard from '../../components/StepCard';
import ProgressIndicator from '../../components/ProgressIndicator';

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

  const [currentStepIndex, setCurrentStepIndex] = useState(0);

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
   * Navigate to next step
   */
  const goToNextStep = useCallback(() => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
    }
  }, [currentStepIndex, steps.length]);

  /**
   * Navigate to previous step
   */
  const goToPreviousStep = useCallback(() => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1);
    }
  }, [currentStepIndex]);

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

  const currentStep = steps[currentStepIndex];

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
