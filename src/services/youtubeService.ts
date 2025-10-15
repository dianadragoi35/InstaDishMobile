import { aiParsingService } from './aiParsingService';
import { ParseRecipeResponse } from '../types';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://192.168.2.27:3000';

export interface TranscriptEntry {
  text: string;
  offset: number;
  duration?: number;
}

export interface TranscriptResult {
  success: boolean;
  transcript?: string;
  entries?: TranscriptEntry[];
  error?: string;
}

export interface YoutubeRecipeResult {
  success: boolean;
  recipe?: ParseRecipeResponse;
  transcript?: string;
  error?: string;
  videoId?: string;
}

/**
 * Extract YouTube video ID from various URL formats
 */
export const extractVideoId = (url: string): string | null => {
  url = url.trim();

  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/.*[?&]v=([a-zA-Z0-9_-]{11})/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  if (/^[a-zA-Z0-9_-]{11}$/.test(url)) {
    return url;
  }

  return null;
};

/**
 * Validate YouTube URL format
 */
export const isValidYouTubeUrl = (url: string): boolean => {
  return extractVideoId(url) !== null;
};

/**
 * Fetch YouTube video transcript from backend API
 */
export const fetchYouTubeTranscript = async (youtubeUrl: string): Promise<TranscriptResult> => {
  if (!isValidYouTubeUrl(youtubeUrl)) {
    return {
      success: false,
      error: 'Invalid YouTube URL format'
    };
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/youtube/transcript`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ youtubeUrl })
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || `Server error: ${response.status}`
      };
    }

    if (!data.success) {
      return {
        success: false,
        error: data.error || 'Failed to fetch transcript'
      };
    }

    return {
      success: true,
      transcript: data.transcript,
      entries: data.entries || []
    };

  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error occurred'
    };
  }
};

/**
 * Clean transcript text for recipe parsing
 */
export const cleanTranscriptForRecipe = (transcript: string): string => {
  return transcript
    .replace(/\b(like and subscribe|don't forget to subscribe|hit the bell|comment below)\b/gi, '')
    .replace(/^[A-Z\s]+:/gm, '')
    .replace(/\[\d{2}:\d{2}:\d{2}\]/g, '')
    .replace(/\(\d{2}:\d{2}\)/g, '')
    .replace(/\s+/g, ' ')
    .trim();
};

/**
 * Extract recipe from YouTube video by fetching transcript and parsing with AI
 */
export const extractRecipeFromYouTubeVideo = async (youtubeUrl: string, language: string = 'English'): Promise<YoutubeRecipeResult> => {
  if (!isValidYouTubeUrl(youtubeUrl)) {
    return {
      success: false,
      error: 'Invalid YouTube URL format'
    };
  }

  try {
    // Step 1: Fetch transcript
    const transcriptResult = await fetchYouTubeTranscript(youtubeUrl);

    if (!transcriptResult.success || !transcriptResult.transcript) {
      return {
        success: false,
        error: transcriptResult.error || 'Failed to fetch video transcript'
      };
    }

    // Step 2: Clean transcript for recipe parsing
    const cleanedTranscript = cleanTranscriptForRecipe(transcriptResult.transcript);

    if (cleanedTranscript.length < 50) {
      return {
        success: false,
        error: 'Transcript too short or doesn\'t contain meaningful recipe content'
      };
    }

    // Step 3: Parse transcript with AI to extract recipe
    const parsingResult = await aiParsingService.parseRecipe({
      recipeText: cleanedTranscript,
      language
    });

    if (!parsingResult) {
      return {
        success: false,
        transcript: cleanedTranscript,
        error: 'Failed to extract recipe from transcript'
      };
    }

    return {
      success: true,
      recipe: parsingResult,
      transcript: cleanedTranscript,
      videoId: extractVideoId(youtubeUrl) || undefined
    };

  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
};

/**
 * Validate that a transcript contains recipe-like content
 */
export const validateRecipeContent = (transcript: string): { isValid: boolean; confidence: number; reasons: string[] } => {
  const recipeKeywords = [
    'recipe', 'cook', 'bake', 'ingredient', 'cup', 'tablespoon', 'teaspoon',
    'oven', 'heat', 'mix', 'stir', 'add', 'pour', 'chop', 'dice', 'slice',
    'minute', 'hour', 'temperature', 'degrees', 'flour', 'salt', 'pepper',
    'oil', 'butter', 'onion', 'garlic', 'serve', 'dish', 'meal'
  ];

  const lowerTranscript = transcript.toLowerCase();
  const words = lowerTranscript.split(/\s+/);
  const totalWords = words.length;

  if (totalWords < 50) {
    return {
      isValid: false,
      confidence: 0,
      reasons: ['Transcript too short']
    };
  }

  let keywordCount = 0;
  const foundKeywords: string[] = [];

  recipeKeywords.forEach(keyword => {
    const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
    const matches = lowerTranscript.match(regex);
    if (matches) {
      keywordCount += matches.length;
      foundKeywords.push(keyword);
    }
  });

  const keywordDensity = keywordCount / totalWords;
  const uniqueKeywords = foundKeywords.length;

  let confidence = 0;
  const reasons: string[] = [];

  // Keyword density check
  if (keywordDensity >= 0.05) {
    confidence += 0.4;
    reasons.push('Good keyword density');
  } else if (keywordDensity >= 0.02) {
    confidence += 0.2;
    reasons.push('Moderate keyword density');
  } else {
    reasons.push('Low recipe keyword density');
  }

  // Unique keywords check
  if (uniqueKeywords >= 10) {
    confidence += 0.3;
    reasons.push('Many recipe keywords found');
  } else if (uniqueKeywords >= 5) {
    confidence += 0.2;
    reasons.push('Some recipe keywords found');
  } else {
    reasons.push('Few recipe keywords found');
  }

  // Length check
  if (totalWords >= 200) {
    confidence += 0.2;
    reasons.push('Good transcript length');
  } else if (totalWords >= 100) {
    confidence += 0.1;
    reasons.push('Adequate transcript length');
  } else {
    reasons.push('Short transcript');
  }

  // Cooking instruction patterns
  const instructionPatterns = [
    /\b(first|then|next|after|finally|meanwhile)\b/gi,
    /\b(add|mix|stir|cook|bake|fry|boil|simmer)\b/gi,
    /\b\d+\s*(minute|hour|degree|cup|tablespoon|teaspoon)\b/gi
  ];

  let patternMatches = 0;
  instructionPatterns.forEach(pattern => {
    if (lowerTranscript.match(pattern)) {
      patternMatches++;
    }
  });

  if (patternMatches >= 2) {
    confidence += 0.1;
    reasons.push('Contains cooking instruction patterns');
  }

  return {
    isValid: confidence >= 0.3,
    confidence: Math.min(confidence, 1.0),
    reasons
  };
};

export const youtubeService = {
  extractVideoId,
  isValidYouTubeUrl,
  fetchYouTubeTranscript,
  cleanTranscriptForRecipe,
  extractRecipeFromYouTubeVideo,
  validateRecipeContent
};
