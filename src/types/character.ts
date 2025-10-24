/**
 * Character Animation Types
 *
 * Defines animation states and types for the cooking character feature (Issue #57)
 */

/**
 * Available character animation states
 */
export enum CharacterAnimation {
  /** Default looping animation when no specific action is happening */
  Idle = 'idle',

  /** Speaking/talking animation synced with voice narration */
  Speaking = 'speaking',

  /** Celebration animation played when user completes a step */
  Celebration = 'celebration',

  /** Alert animation played when timer completes */
  TimerAlert = 'timer-alert',
}

/**
 * Animation priority levels (higher = takes precedence)
 * Used to determine which animation should play when multiple triggers occur
 */
export const ANIMATION_PRIORITIES: Record<CharacterAnimation, number> = {
  [CharacterAnimation.TimerAlert]: 5,      // Highest priority
  [CharacterAnimation.Celebration]: 4,
  [CharacterAnimation.Speaking]: 3,
  [CharacterAnimation.Idle]: 0,            // Lowest priority (default)
};

/**
 * Animation duration in milliseconds for one-shot animations
 * Note: Celebration is now looping (no duration) - it loops continuously on final step
 */
export const ANIMATION_DURATIONS: Partial<Record<CharacterAnimation, number>> = {
  // [CharacterAnimation.Celebration]: removed - now loops continuously on final step
  [CharacterAnimation.TimerAlert]: 5000,   // 5 seconds
  // Idle, Speaking, and Celebration all loop indefinitely
};

/**
 * Opacity levels for different animation states
 */
export const ANIMATION_OPACITY: Record<CharacterAnimation, number> = {
  [CharacterAnimation.Idle]: 0.7,          // Semi-transparent when idle
  [CharacterAnimation.Speaking]: 1.0,      // Full opacity when active
  [CharacterAnimation.Celebration]: 1.0,   // Full opacity for celebration
  [CharacterAnimation.TimerAlert]: 1.0,    // Full opacity for alerts
};

/**
 * Animation file sources
 * Maps animation states to their Lottie JSON file paths
 */
export const ANIMATION_SOURCES = {
  [CharacterAnimation.Idle]: require('../assets/animations/chef-idle.json'),
  [CharacterAnimation.Speaking]: require('../assets/animations/chef-talking.json'),
  [CharacterAnimation.Celebration]: require('../assets/animations/chef-celebrate.json'),
  [CharacterAnimation.TimerAlert]: require('../assets/animations/chef-alert.json'),
} as const;

/**
 * Character size configuration
 */
export const CHARACTER_CONFIG = {
  /** Character size in pixels */
  size: 100,

  /** Position from bottom of screen in pixels */
  bottomOffset: 20,

  /** Position from right of screen in pixels */
  rightOffset: 20,

  /** Z-index to ensure character appears above content but below controls */
  zIndex: 10,
} as const;
