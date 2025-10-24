/**
 * Time Detection Utility
 * Extracts time durations from recipe step text
 */

export interface DetectedTime {
  duration: number; // Duration in seconds
  text: string; // Original matched text (e.g., "5 minutes")
  startIndex: number; // Start position in text
  endIndex: number; // End position in text
}

/**
 * Regex patterns for detecting time references in text
 * Supports: minutes, hours, seconds, ranges
 */
const TIME_PATTERNS = [
  // Range patterns (e.g., "5-7 minutes", "1-2 hours")
  {
    regex: /(\d+)\s*-\s*(\d+)\s*(minutes?|mins?|hours?|hrs?|seconds?|secs?)/gi,
    type: 'range',
  },
  // Single time patterns (e.g., "5 minutes", "1 hour", "30 seconds")
  {
    regex: /(\d+(?:\.\d+)?)\s*(minutes?|mins?|hours?|hrs?|seconds?|secs?)/gi,
    type: 'single',
  },
];

/**
 * Convert time value to seconds based on unit
 */
function convertToSeconds(value: number, unit: string): number {
  const normalizedUnit = unit.toLowerCase();

  if (normalizedUnit.startsWith('hour') || normalizedUnit.startsWith('hr')) {
    return value * 3600; // hours to seconds
  } else if (normalizedUnit.startsWith('minute') || normalizedUnit.startsWith('min')) {
    return value * 60; // minutes to seconds
  } else if (normalizedUnit.startsWith('second') || normalizedUnit.startsWith('sec')) {
    return value; // already in seconds
  }

  return 0;
}

/**
 * Detect all time references in a given text
 * Returns array of detected times with their positions
 */
export function detectTimeInText(text: string): DetectedTime[] {
  if (!text) return [];

  const detectedTimes: DetectedTime[] = [];

  for (const pattern of TIME_PATTERNS) {
    const regex = new RegExp(pattern.regex);
    let match;

    while ((match = regex.exec(text)) !== null) {
      let duration: number;

      if (pattern.type === 'range') {
        // For ranges like "5-7 minutes", use the midpoint
        const min = parseFloat(match[1]);
        const max = parseFloat(match[2]);
        const unit = match[3];
        const avgValue = (min + max) / 2;
        duration = convertToSeconds(avgValue, unit);
      } else {
        // Single time value
        const value = parseFloat(match[1]);
        const unit = match[2];
        duration = convertToSeconds(value, unit);
      }

      if (duration > 0) {
        detectedTimes.push({
          duration,
          text: match[0],
          startIndex: match.index,
          endIndex: match.index + match[0].length,
        });
      }
    }
  }

  // Sort by position in text
  return detectedTimes.sort((a, b) => a.startIndex - b.startIndex);
}

/**
 * Detect the primary (first) time reference in text
 * Most common use case for timer buttons
 */
export function detectPrimaryTime(text: string): DetectedTime | null {
  const times = detectTimeInText(text);
  return times.length > 0 ? times[0] : null;
}

/**
 * Format duration in seconds to MM:SS display format
 */
export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    // HH:MM:SS format for durations over 1 hour
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  } else {
    // MM:SS format for durations under 1 hour
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
}

/**
 * Format duration in seconds to human-readable text (e.g., "5 min", "1h 30m")
 */
export function formatDurationText(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0 && minutes > 0) {
    return `${hours}h ${minutes}m`;
  } else if (hours > 0) {
    return `${hours}h`;
  } else if (minutes > 0) {
    return `${minutes} min`;
  } else {
    return `${secs}s`;
  }
}
