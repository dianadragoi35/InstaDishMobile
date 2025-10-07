import express from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';

const router = express.Router();

export interface ParseRecipeRequest {
  recipeText: string;
  language?: string;
}

export interface ParseRecipeResponse {
  recipeName: string;
  ingredients: Array<{
    name: string;
    quantity: string;
    notes?: string;
  }>;
  instructions: string;
  prepTime?: string;
  cookTime?: string;
  servings?: string;
}

/**
 * POST /api/recipes/parse
 * Parse recipe text using Google Gemini AI
 */
router.post('/parse', async (req, res) => {
  try {
    const { recipeText, language = 'English' }: ParseRecipeRequest = req.body;

    // Validate input
    if (!recipeText || !recipeText.trim()) {
      return res.status(400).json({ error: 'Recipe text is required' });
    }

    if (!process.env.GEMINI_API_KEY) {
      console.error('GEMINI_API_KEY is not configured');
      return res.status(500).json({ error: 'AI service is not configured' });
    }

    console.log('GEMINI_API_KEY present:', !!process.env.GEMINI_API_KEY);
    console.log('GEMINI_API_KEY length:', process.env.GEMINI_API_KEY?.length);

    // Initialize Gemini AI with the API key
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

    const prompt = `You are a recipe parser. Parse the following recipe text into structured JSON format.
Return ONLY valid JSON with this exact structure (no markdown, no code blocks, no explanations):

{
  "recipeName": "string",
  "ingredients": [
    {
      "name": "ingredient name",
      "quantity": "amount with unit (or 'to taste' if not specified)",
      "notes": "optional notes like 'diced' or 'room temperature'"
    }
  ],
  "instructions": "step by step cooking instructions as a single text",
  "prepTime": "preparation time (e.g., '15 min')",
  "cookTime": "cooking time (e.g., '30 min')",
  "servings": "number of servings (e.g., '4 servings')"
}

Important rules:
- Extract the recipe name from the text (if not explicitly stated, infer it from context)
- Parse each ingredient with its quantity and name separately
- If the recipe text only contains a method/instructions without ingredients list, try to extract ingredients mentioned in the method
- For ingredients mentioned in instructions but without quantities, use "to taste" or "as needed" for quantity
- If measurements or preparation notes (like 'diced', 'chopped') are mentioned, put them in the notes field
- Combine all instructions into a single paragraph with clear numbered steps
- Extract timing information if mentioned, otherwise provide reasonable estimates based on the recipe complexity
- Extract servings if mentioned, otherwise provide a reasonable estimate
- If any optional field is not found in the text, you can omit it or use an empty string
- All text should be in ${language}
- Return ONLY valid, complete JSON - ensure all brackets and quotes are closed properly
- Do not truncate the response - include all ingredients and full instructions

Recipe text to parse:
${recipeText}`;

    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.2,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 4096, // Increased for longer recipes
      },
    });

    const result = await model.generateContent(prompt);
    let text = result.response.text().trim();

    // Clean the response - remove markdown code blocks if present
    text = text.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim();

    // Parse the JSON response
    let parsedRecipe: ParseRecipeResponse;
    try {
      parsedRecipe = JSON.parse(text);
    } catch (parseError) {
      console.error('Failed to parse Gemini response as JSON:', text.substring(0, 500));

      // Try to fix common JSON issues
      let fixedText = text;

      // If response is truncated, try to close it
      if (!text.trim().endsWith('}')) {
        const openBraces = (text.match(/{/g) || []).length;
        const closeBraces = (text.match(/}/g) || []).length;
        const openBrackets = (text.match(/\[/g) || []).length;
        const closeBrackets = (text.match(/\]/g) || []).length;

        // Add missing closing brackets/braces
        for (let i = 0; i < openBrackets - closeBrackets; i++) {
          fixedText += ']';
        }
        for (let i = 0; i < openBraces - closeBraces; i++) {
          fixedText += '}';
        }

        try {
          parsedRecipe = JSON.parse(fixedText);
          console.log('Successfully fixed truncated JSON response');
        } catch {
          return res.status(500).json({
            error: 'AI returned incomplete or invalid response format',
            details: text.substring(0, 300),
            suggestion: 'Try with a shorter recipe or check if the recipe text is complete'
          });
        }
      } else {
        return res.status(500).json({
          error: 'AI returned invalid response format',
          details: text.substring(0, 300)
        });
      }
    }

    // Validate required fields
    if (!parsedRecipe.recipeName || !parsedRecipe.ingredients || !parsedRecipe.instructions) {
      return res.status(500).json({
        error: 'AI response missing required fields',
        received: parsedRecipe
      });
    }

    if (parsedRecipe.ingredients.length === 0) {
      return res.status(500).json({ error: 'AI response missing ingredients' });
    }

    // Ensure all ingredients have required fields
    for (const ingredient of parsedRecipe.ingredients) {
      if (!ingredient.name || !ingredient.quantity) {
        return res.status(500).json({
          error: 'Invalid ingredient format in AI response',
          ingredient
        });
      }
    }

    // Set defaults for optional fields if missing
    parsedRecipe.prepTime = parsedRecipe.prepTime || '';
    parsedRecipe.cookTime = parsedRecipe.cookTime || '';
    parsedRecipe.servings = parsedRecipe.servings || '';

    return res.json(parsedRecipe);

  } catch (error) {
    console.error('Recipe parsing API error:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

    return res.status(500).json({
      error: `Failed to parse recipe: ${errorMessage}`
    });
  }
});

export default router;
