import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  PanResponder,
  Animated,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { RecipesStackParamList } from '../../navigation/AppNavigator';
import { RecipeStep } from '../../types';
import StepCard from '../../components/StepCard';

type CookingModeScreenRouteProp = RouteProp<RecipesStackParamList, 'CookingMode'>;
type CookingModeScreenNavigationProp = NativeStackNavigationProp<
  RecipesStackParamList,
  'CookingMode'
>;

const { width } = Dimensions.get('window');

/**
 * Cooking Mode Screen
 * Full-screen immersive interface for step-by-step cooking instructions
 * Features:
 * - Swipe left/right to navigate between steps
 * - Tap left/right sides of screen to navigate
 * - Full-screen layout with hidden nav bars
 * - Smooth animations between steps
 */
export default function CookingModeScreen() {
  const route = useRoute<CookingModeScreenRouteProp>();
  const navigation = useNavigation<CookingModeScreenNavigationProp>();
  const { steps } = route.params;

  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const translateX = useRef(new Animated.Value(0)).current;

  // Hide status bar for immersive experience
  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: false,
    });
  }, [navigation]);

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

  // Pan responder for swipe gestures
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // Only activate pan responder if horizontal movement is significant
        return Math.abs(gestureState.dx) > 10;
      },
      onPanResponderGrant: () => {
        translateX.setOffset(0);
      },
      onPanResponderMove: (_, gestureState) => {
        translateX.setValue(gestureState.dx);
      },
      onPanResponderRelease: (_, gestureState) => {
        const threshold = width * 0.25; // 25% of screen width

        if (gestureState.dx > threshold && currentStepIndex > 0) {
          // Swipe right - go to previous step
          goToPreviousStep();
        } else if (gestureState.dx < -threshold && currentStepIndex < steps.length - 1) {
          // Swipe left - go to next step
          goToNextStep();
        }

        // Reset translation with spring animation
        Animated.spring(translateX, {
          toValue: 0,
          useNativeDriver: true,
        }).start();
      },
      onPanResponderTerminate: () => {
        // Reset on termination
        Animated.spring(translateX, {
          toValue: 0,
          useNativeDriver: true,
        }).start();
      },
    })
  ).current;

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

      {/* Exit Button */}
      <TouchableOpacity style={styles.exitButton} onPress={exitCookingMode}>
        <MaterialCommunityIcons name="close" size={28} color="#111827" />
      </TouchableOpacity>

      {/* Main Content with Swipe Gesture */}
      <View style={styles.contentContainer} {...panResponder.panHandlers}>
        <Animated.View
          style={[
            styles.animatedContainer,
            { transform: [{ translateX }] },
          ]}
        >
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
                step={currentStep}
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
        </Animated.View>

        {/* Navigation Hint on First Load */}
        {currentStepIndex === 0 && (
          <View style={styles.hintContainer}>
            <Text style={styles.hintText}>Swipe or tap sides to navigate</Text>
            <View style={styles.hintArrows}>
              <MaterialCommunityIcons name="gesture-swipe-left" size={24} color="#9CA3AF" />
              <MaterialCommunityIcons name="gesture-swipe-right" size={24} color="#9CA3AF" />
            </View>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  exitButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 10,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  contentContainer: {
    flex: 1,
  },
  animatedContainer: {
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
    marginBottom: 8,
  },
  hintArrows: {
    flexDirection: 'row',
    gap: 16,
  },
});
