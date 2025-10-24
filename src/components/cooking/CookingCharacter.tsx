/**
 * CookingCharacter Component
 *
 * Displays an animated chef character that provides visual engagement and encouragement
 * during cooking mode. Character animations sync with voice narration, timer events,
 * and step completion.
 *
 * Related Issue: #57 - Animated Cooking Character (Duolingo-style)
 */

import React, { useRef, useEffect } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import LottieView from 'lottie-react-native';
import {
  CharacterAnimation,
  ANIMATION_SOURCES,
  ANIMATION_OPACITY,
  ANIMATION_DURATIONS,
  CHARACTER_CONFIG,
} from '../../types/character';

interface CookingCharacterProps {
  /** Current animation state to display */
  currentAnimation: CharacterAnimation;

  /** Optional callback when a one-shot animation completes */
  onAnimationComplete?: (animation: CharacterAnimation) => void;

  /** Position mode: 'inline' (in step card) or 'absolute' (bottom-right corner) */
  position?: 'inline' | 'absolute';

  /** Custom size override (default uses CHARACTER_CONFIG.size) */
  size?: number;
}

/**
 * Animated cooking character component
 *
 * Features:
 * - Displays Lottie animations for different character states
 * - Smooth opacity transitions between active and idle states
 * - Positioned in bottom-right corner, non-obtrusive
 * - Handles looping vs one-shot animations automatically
 *
 * @example
 * ```tsx
 * <CookingCharacter
 *   currentAnimation={CharacterAnimation.Speaking}
 *   onAnimationComplete={handleAnimationComplete}
 * />
 * ```
 */
export const CookingCharacter: React.FC<CookingCharacterProps> = ({
  currentAnimation,
  onAnimationComplete,
  position = 'absolute',
  size,
}) => {
  const animationRef = useRef<LottieView>(null);
  const opacityAnim = useRef(new Animated.Value(ANIMATION_OPACITY[CharacterAnimation.Idle])).current;

  // Get animation source for current state
  const animationSource = ANIMATION_SOURCES[currentAnimation];

  // Determine if current animation should loop
  const shouldLoop = !ANIMATION_DURATIONS[currentAnimation];

  /**
   * Update opacity when animation changes
   */
  useEffect(() => {
    const targetOpacity = ANIMATION_OPACITY[currentAnimation];

    Animated.timing(opacityAnim, {
      toValue: targetOpacity,
      duration: 300, // Smooth 300ms transition
      useNativeDriver: true,
    }).start();
  }, [currentAnimation, opacityAnim]);

  /**
   * Handle animation completion for one-shot animations
   */
  const handleAnimationFinish = () => {
    // Only trigger callback for one-shot animations (those with durations)
    if (ANIMATION_DURATIONS[currentAnimation] && onAnimationComplete) {
      onAnimationComplete(currentAnimation);
    }
  };

  /**
   * Reset and play animation when it changes
   */
  useEffect(() => {
    if (animationRef.current) {
      animationRef.current.reset();
      animationRef.current.play();
    }
  }, [currentAnimation]);

  const characterSize = size || CHARACTER_CONFIG.size;
  const isInline = position === 'inline';

  return (
    <Animated.View
      style={[
        isInline ? styles.inlineContainer : styles.container,
        {
          opacity: opacityAnim,
        },
        !isInline && {
          bottom: CHARACTER_CONFIG.bottomOffset,
          right: CHARACTER_CONFIG.rightOffset,
        },
      ]}
    >
      <LottieView
        ref={animationRef}
        source={animationSource}
        autoPlay
        loop={shouldLoop}
        style={[
          styles.animation,
          {
            width: characterSize,
            height: characterSize,
          },
        ]}
        onAnimationFinish={handleAnimationFinish}
      />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    zIndex: CHARACTER_CONFIG.zIndex,
    // Ensure character doesn't block touch events on main content
    pointerEvents: 'none',
  },
  inlineContainer: {
    // Inline positioning for StepCard (replaces step number badge)
    justifyContent: 'center',
    alignItems: 'center',
    pointerEvents: 'none',
  },
  animation: {
    // Size is dynamically set from CHARACTER_CONFIG or size prop
  },
});
