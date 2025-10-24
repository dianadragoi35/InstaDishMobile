/**
 * useCharacterAnimation Hook
 *
 * Manages animation state for the cooking character, including:
 * - Animation priority system (higher priority animations interrupt lower ones)
 * - One-shot animations that auto-return to idle
 * - Manual animation control functions
 *
 * Related Issue: #57 - Animated Cooking Character (Duolingo-style)
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import {
  CharacterAnimation,
  ANIMATION_PRIORITIES,
  ANIMATION_DURATIONS,
} from '../types/character';

interface UseCharacterAnimationReturn {
  /** Current animation being displayed */
  currentAnimation: CharacterAnimation;

  /** Transition to a new animation (respects priority system) */
  setAnimation: (animation: CharacterAnimation) => void;

  /** Play a one-shot animation that returns to idle when complete */
  playOneShot: (animation: CharacterAnimation, duration?: number) => void;

  /** Force return to idle animation (clears any queued animations) */
  resetToIdle: () => void;

  /** Check if a specific animation is currently playing */
  isPlaying: (animation: CharacterAnimation) => boolean;
}

/**
 * Custom hook for managing cooking character animations
 *
 * Features:
 * - Priority-based animation system (alerts override celebrations, etc.)
 * - Auto-cleanup for one-shot animations
 * - Prevents animation interruption by lower-priority triggers
 *
 * @example
 * ```tsx
 * const { currentAnimation, setAnimation, playOneShot } = useCharacterAnimation();
 *
 * // Start speaking when narration begins
 * useEffect(() => {
 *   if (isNarrating) {
 *     setAnimation(CharacterAnimation.Speaking);
 *   } else {
 *     setAnimation(CharacterAnimation.Idle);
 *   }
 * }, [isNarrating]);
 *
 * // Celebrate on step completion
 * const handleStepComplete = () => {
 *   playOneShot(CharacterAnimation.Celebration);
 * };
 * ```
 */
export const useCharacterAnimation = (): UseCharacterAnimationReturn => {
  const [currentAnimation, setCurrentAnimation] = useState<CharacterAnimation>(
    CharacterAnimation.Idle
  );

  // Track timeout for one-shot animations
  const oneShotTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Get priority level for an animation
   */
  const getAnimationPriority = useCallback((animation: CharacterAnimation): number => {
    return ANIMATION_PRIORITIES[animation] || 0;
  }, []);

  /**
   * Transition to a new animation (respects priority)
   *
   * Higher priority animations can interrupt lower priority ones,
   * but not vice versa. This prevents jarring transitions.
   */
  const setAnimation = useCallback(
    (newAnimation: CharacterAnimation) => {
      const currentPriority = getAnimationPriority(currentAnimation);
      const newPriority = getAnimationPriority(newAnimation);

      // Only allow transition if new animation has higher or equal priority
      if (newPriority >= currentPriority) {
        // Clear any pending one-shot timeout
        if (oneShotTimeoutRef.current) {
          clearTimeout(oneShotTimeoutRef.current);
          oneShotTimeoutRef.current = null;
        }

        setCurrentAnimation(newAnimation);
      }
    },
    [currentAnimation, getAnimationPriority]
  );

  /**
   * Play a one-shot animation that automatically returns to idle
   *
   * @param animation - The animation to play
   * @param duration - Optional override for animation duration (ms)
   */
  const playOneShot = useCallback(
    (animation: CharacterAnimation, duration?: number) => {
      // Clear any existing timeout
      if (oneShotTimeoutRef.current) {
        clearTimeout(oneShotTimeoutRef.current);
        oneShotTimeoutRef.current = null;
      }

      // Set the animation
      setCurrentAnimation(animation);

      // Calculate duration (use override or default from config)
      const animationDuration = duration || ANIMATION_DURATIONS[animation];

      if (animationDuration) {
        // Schedule return to idle after duration
        oneShotTimeoutRef.current = setTimeout(() => {
          setCurrentAnimation(CharacterAnimation.Idle);
          oneShotTimeoutRef.current = null;
        }, animationDuration);
      }
    },
    []
  );

  /**
   * Force return to idle animation
   * Clears any pending one-shot timeouts
   */
  const resetToIdle = useCallback(() => {
    if (oneShotTimeoutRef.current) {
      clearTimeout(oneShotTimeoutRef.current);
      oneShotTimeoutRef.current = null;
    }
    setCurrentAnimation(CharacterAnimation.Idle);
  }, []);

  /**
   * Check if a specific animation is currently playing
   */
  const isPlaying = useCallback(
    (animation: CharacterAnimation): boolean => {
      return currentAnimation === animation;
    },
    [currentAnimation]
  );

  /**
   * Cleanup timeout on unmount
   */
  useEffect(() => {
    return () => {
      if (oneShotTimeoutRef.current) {
        clearTimeout(oneShotTimeoutRef.current);
      }
    };
  }, []);

  return {
    currentAnimation,
    setAnimation,
    playOneShot,
    resetToIdle,
    isPlaying,
  };
};
