import express, { Request, Response } from 'express';
import { YoutubeTranscript } from '@danielxceron/youtube-transcript';

const router = express.Router();

interface TranscriptEntry {
  text: string;
  offset: number;
  duration?: number;
}

interface TranscriptApiResponse {
  success: boolean;
  transcript?: string;
  entries?: TranscriptEntry[];
  imageUrl?: string;
  error?: string;
}

/**
 * Extract YouTube video ID from various URL formats
 */
function extractVideoId(url: string): string | null {
  // Remove any whitespace
  url = url.trim();

  // Regular YouTube URL patterns
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

  // If it's already just a video ID (11 characters)
  if (/^[a-zA-Z0-9_-]{11}$/.test(url)) {
    return url;
  }

  return null;
}

/**
 * Get YouTube video thumbnail URL
 * Uses maxresdefault for highest quality, with automatic fallback to lower resolutions
 */
function getYouTubeThumbnail(videoId: string): string {
  // YouTube automatically falls back to hqdefault if maxresdefault doesn't exist
  return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
}

/**
 * Clean transcript text for recipe parsing
 */
function cleanTranscriptForRecipe(transcript: string): string {
  return transcript
    // Remove common non-recipe phrases
    .replace(/\b(like and subscribe|don't forget to subscribe|hit the bell|comment below)\b/gi, '')
    // Remove speaker indicators
    .replace(/^[A-Z\s]+:/gm, '')
    // Remove timestamp patterns
    .replace(/\[\d{2}:\d{2}:\d{2}\]/g, '')
    .replace(/\(\d{2}:\d{2}\)/g, '')
    // Clean up extra whitespace
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * POST /api/youtube/transcript
 * Fetch YouTube video transcript
 */
router.post('/transcript', async (req: Request, res: Response) => {
  try {
    const { youtubeUrl } = req.body;

    console.log('🎬 YouTube Transcript API called:', {
      url: youtubeUrl,
      timestamp: new Date().toISOString()
    });

    if (!youtubeUrl) {
      return res.status(400).json({
        success: false,
        error: 'YouTube URL is required'
      } as TranscriptApiResponse);
    }

    // Extract video ID from URL
    const videoId = extractVideoId(youtubeUrl);
    console.log('📝 Extracted video ID:', videoId);

    if (!videoId) {
      return res.status(400).json({
        success: false,
        error: 'Invalid YouTube URL format'
      } as TranscriptApiResponse);
    }

    console.log('🔄 Attempting to fetch transcript for video ID:', videoId);

    // Fetch transcript using the YouTube transcript package
    const transcriptArray = await YoutubeTranscript.fetchTranscript(videoId);

    console.log('✅ Transcript fetch successful, entries count:', transcriptArray?.length);

    if (!transcriptArray || transcriptArray.length === 0) {
      console.warn('⚠️ No transcript entries found for video:', videoId);
      return res.status(404).json({
        success: false,
        error: 'No transcript available for this video'
      } as TranscriptApiResponse);
    }

    // Combine transcript entries into full text
    const rawTranscript = transcriptArray.map(entry => entry.text).join(' ');
    const cleanedTranscript = cleanTranscriptForRecipe(rawTranscript);

    // Get video thumbnail URL
    const thumbnailUrl = getYouTubeThumbnail(videoId);
    console.log('🖼️ Generated thumbnail URL:', thumbnailUrl);

    console.log('📊 Transcript processing complete:', {
      rawLength: rawTranscript.length,
      cleanedLength: cleanedTranscript.length,
      entriesCount: transcriptArray.length
    });

    // Convert to our format
    const entries: TranscriptEntry[] = transcriptArray.map(entry => ({
      text: entry.text,
      offset: entry.offset || 0,
      duration: entry.duration
    }));

    const response: TranscriptApiResponse = {
      success: true,
      transcript: cleanedTranscript,
      entries,
      imageUrl: thumbnailUrl
    };

    return res.json(response);

  } catch (error) {
    console.error('❌ YouTube transcript API error:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      type: typeof error
    });

    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

    // Handle specific error cases
    if (errorMessage.includes('Transcript is disabled') || errorMessage.includes('disabled')) {
      console.warn('📺 Transcript disabled for video');
      return res.status(404).json({
        success: false,
        error: 'Transcript is disabled for this video'
      } as TranscriptApiResponse);
    }

    if (errorMessage.includes('Video unavailable') || errorMessage.includes('unavailable')) {
      console.warn('🚫 Video unavailable');
      return res.status(404).json({
        success: false,
        error: 'Video is unavailable or private'
      } as TranscriptApiResponse);
    }

    // Network/timeout issues
    if (errorMessage.includes('timeout') || errorMessage.includes('ETIMEDOUT') || errorMessage.includes('ECONNRESET')) {
      console.error('🌐 Network timeout');
      return res.status(503).json({
        success: false,
        error: 'Network timeout - please try again'
      } as TranscriptApiResponse);
    }

    return res.status(500).json({
      success: false,
      error: `Failed to fetch transcript: ${errorMessage}`
    } as TranscriptApiResponse);
  }
});

export default router;
