import * as Speech from 'expo-speech';

/**
 * Narration Service
 * Handles text-to-speech functionality for cooking instructions
 */

/**
 * Check if speech synthesis is available on the device
 */
export async function isSpeechAvailable(): Promise<boolean> {
  try {
    const voices = await Speech.getAvailableVoicesAsync();
    return voices.length > 0;
  } catch (error) {
    console.error('Failed to check speech availability:', error);
    return false;
  }
}

/**
 * Narrate a step instruction
 * @param text - The text to narrate
 * @param language - Language code (e.g., 'en', 'es', 'fr')
 * @param speed - Speech rate (0.5 to 1.5)
 */
export async function narrateStep(
  text: string,
  language: string,
  speed: number = 1.0
): Promise<void> {
  try {
    // Stop any ongoing speech first
    await stopNarration();

    // Validate speed is within bounds
    const validSpeed = Math.max(0.5, Math.min(1.5, speed));

    // Start speaking
    await Speech.speak(text, {
      language: language,
      pitch: 1.0,
      rate: validSpeed,
      onDone: () => {
        console.log('Narration completed');
      },
      onError: (error) => {
        console.error('Narration error:', error);
      },
    });
  } catch (error) {
    console.error('Failed to narrate step:', error);
    throw error;
  }
}

/**
 * Stop any ongoing narration
 */
export async function stopNarration(): Promise<void> {
  try {
    const isSpeaking = await Speech.isSpeakingAsync();
    if (isSpeaking) {
      await Speech.stop();
    }
  } catch (error) {
    console.error('Failed to stop narration:', error);
  }
}

/**
 * Pause ongoing narration (if supported)
 */
export async function pauseNarration(): Promise<void> {
  try {
    const isSpeaking = await Speech.isSpeakingAsync();
    if (isSpeaking) {
      await Speech.pause();
    }
  } catch (error) {
    console.error('Failed to pause narration:', error);
  }
}

/**
 * Resume paused narration (if supported)
 */
export async function resumeNarration(): Promise<void> {
  try {
    await Speech.resume();
  } catch (error) {
    console.error('Failed to resume narration:', error);
  }
}

/**
 * Check if speech is currently playing
 */
export async function isSpeaking(): Promise<boolean> {
  try {
    return await Speech.isSpeakingAsync();
  } catch (error) {
    console.error('Failed to check speaking status:', error);
    return false;
  }
}

/**
 * Get available voices for a language
 * @param language - Language code (e.g., 'en', 'es', 'fr')
 */
export async function getVoicesForLanguage(language: string): Promise<Speech.Voice[]> {
  try {
    const voices = await Speech.getAvailableVoicesAsync();
    return voices.filter(voice => voice.language.startsWith(language));
  } catch (error) {
    console.error('Failed to get voices:', error);
    return [];
  }
}
