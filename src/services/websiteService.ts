import { aiParsingService } from './aiParsingService';
import { ParseRecipeResponse } from '../types';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://192.168.2.27:3000';

export interface WebsiteContentResult {
  success: boolean;
  content?: string;
  error?: string;
}

export interface WebsiteRecipeResult {
  success: boolean;
  recipe?: ParseRecipeResponse;
  content?: string;
  error?: string;
}

/**
 * Validate if URL is properly formatted
 */
export const isValidWebsiteUrl = (url: string): boolean => {
  try {
    const urlObj = new URL(url.trim());
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
  } catch {
    return false;
  }
};

/**
 * Fetch website content from backend API
 */
export const fetchWebsiteContent = async (websiteUrl: string): Promise<WebsiteContentResult> => {
  if (!isValidWebsiteUrl(websiteUrl)) {
    return {
      success: false,
      error: 'Invalid website URL format'
    };
  }

  try {
    const response = await fetch(`${API_BASE_URL}/website/content`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ websiteUrl })
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
        error: data.error || 'Failed to fetch website content'
      };
    }

    return {
      success: true,
      content: data.content
    };

  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error occurred'
    };
  }
};

/**
 * Clean website content for recipe parsing
 */
export const cleanContentForRecipe = (content: string): string => {
  return content
    .replace(/\b(subscribe|newsletter|follow us|advertisement|privacy policy|terms of service)\\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
};

/**
 * Extract recipe from website URL by fetching content and parsing with AI
 */
export const extractRecipeFromWebsite = async (websiteUrl: string, language: string = 'English'): Promise<WebsiteRecipeResult> => {
  if (!isValidWebsiteUrl(websiteUrl)) {
    return {
      success: false,
      error: 'Invalid website URL format'
    };
  }

  try {
    // Step 1: Fetch website content
    const contentResult = await fetchWebsiteContent(websiteUrl);

    if (!contentResult.success || !contentResult.content) {
      return {
        success: false,
        error: contentResult.error || 'Failed to fetch website content'
      };
    }

    // Step 2: Clean content for recipe parsing
    const cleanedContent = cleanContentForRecipe(contentResult.content);

    if (cleanedContent.length < 50) {
      return {
        success: false,
        error: 'Content too short or doesn\'t contain meaningful recipe information'
      };
    }

    // Step 3: Parse content with AI to extract recipe
    const parsingResult = await aiParsingService.parseRecipe({
      recipeText: cleanedContent,
      language
    });

    if (!parsingResult) {
      return {
        success: false,
        content: cleanedContent,
        error: 'Failed to extract recipe from website content'
      };
    }

    return {
      success: true,
      recipe: parsingResult,
      content: cleanedContent
    };

  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
};

/**
 * Validate that website content contains recipe-like information
 */
export const validateRecipeContent = (content: string): { isValid: boolean; confidence: number; reasons: string[] } => {
  const recipeKeywords = [
    'recipe', 'cook', 'bake', 'ingredient', 'cup', 'tablespoon', 'teaspoon',
    'oven', 'heat', 'mix', 'stir', 'add', 'pour', 'chop', 'dice', 'slice',
    'minute', 'hour', 'temperature', 'degrees', 'flour', 'salt', 'pepper',
    'oil', 'butter', 'onion', 'garlic', 'serve', 'dish', 'meal'
  ];

  const lowerContent = content.toLowerCase();
  const words = lowerContent.split(/\s+/);
  const totalWords = words.length;

  if (totalWords < 50) {
    return {
      isValid: false,
      confidence: 0,
      reasons: ['Content too short']
    };
  }

  let keywordCount = 0;
  const foundKeywords: string[] = [];

  recipeKeywords.forEach(keyword => {
    const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
    const matches = lowerContent.match(regex);
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
    reasons.push('Good content length');
  } else if (totalWords >= 100) {
    confidence += 0.1;
    reasons.push('Adequate content length');
  } else {
    reasons.push('Short content');
  }

  // Cooking instruction patterns
  const instructionPatterns = [
    /\b(first|then|next|after|finally|meanwhile)\b/gi,
    /\b(add|mix|stir|cook|bake|fry|boil|simmer)\b/gi,
    /\b\d+\s*(minute|hour|degree|cup|tablespoon|teaspoon)\b/gi
  ];

  let patternMatches = 0;
  instructionPatterns.forEach(pattern => {
    if (lowerContent.match(pattern)) {
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

export const websiteService = {
  isValidWebsiteUrl,
  fetchWebsiteContent,
  cleanContentForRecipe,
  extractRecipeFromWebsite,
  validateRecipeContent
};
