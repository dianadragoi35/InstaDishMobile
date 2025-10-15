import express from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';

const router = express.Router();

export interface ParseRecipeRequest {
  recipeText: string;
  language?: string;
}

export interface RecipeStep {
  instruction: string;
  time?: string | null;
  imageUrl?: string | null;
}

export interface ParseRecipeResponse {
  recipeName: string;
  ingredients: Array<{
    name: string;
    quantity: string;
    notes?: string;
  }>;
  instructions: string;
  steps?: RecipeStep[];
  prepTime?: string;
  cookTime?: string;
  servings?: string;
}

export interface GenerateRecipeRequest {
  ingredients: string;
  cuisine?: string;
  language?: string;
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
  "steps": [
    {
      "instruction": "individual step instruction",
      "time": "time in minutes as string (e.g., '5') or null if no specific time",
      "imageUrl": null
    }
  ],
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
- IMPORTANT: For ingredients without notes, OMIT the notes field entirely - do not use null
- Combine all instructions into a single paragraph with clear numbered steps
- Break down the instructions into individual steps in the "steps" array - each step should be one discrete action
- For each step, extract any time mentioned (e.g., "bake for 30 minutes" → time: "30", "let rest for 5 minutes" → time: "5")
- If a step doesn't mention a specific time, set time to null
- Always set imageUrl to null in steps (images will be added later by users if needed)
- Extract timing information if mentioned, otherwise provide reasonable estimates based on the recipe complexity
- Extract servings if mentioned, otherwise provide a reasonable estimate
- If any optional field is not found in the text, you can omit it or use an empty string
- All text should be in ${language}
- Return ONLY valid, complete JSON - ensure all brackets and quotes are closed properly
- Do not truncate the response - include all ingredients, full instructions, and all steps

Recipe text to parse:
${recipeText}`;

    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.2,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 8192, // Increased for longer recipes with many steps
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

    // Ensure all ingredients have required fields and normalize notes
    for (const ingredient of parsedRecipe.ingredients) {
      if (!ingredient.name || !ingredient.quantity) {
        return res.status(500).json({
          error: 'Invalid ingredient format in AI response',
          ingredient
        });
      }
      // Normalize null notes to undefined (optional field)
      if (ingredient.notes === null) {
        delete ingredient.notes;
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

/**
 * POST /api/recipes/generate
 * Generate a new recipe from ingredients using Google Gemini AI
 */
router.post('/generate', async (req, res) => {
  try {
    const { ingredients, cuisine = '', language = 'English' }: GenerateRecipeRequest = req.body;

    // Validate input
    if (!ingredients || !ingredients.trim()) {
      return res.status(400).json({ error: 'Ingredients are required' });
    }

    if (!process.env.GEMINI_API_KEY) {
      console.error('GEMINI_API_KEY is not configured');
      return res.status(500).json({ error: 'AI service is not configured' });
    }

    // Initialize Gemini AI with the API key
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

    const cuisineText = cuisine ? `Preferred cuisine: ${cuisine}.` : '';
    const prompt = `You are a creative recipe generator. Generate a complete, delicious recipe using the following ingredients.
Return ONLY valid JSON with this exact structure (no markdown, no code blocks, no explanations):

{
  "recipeName": "string",
  "ingredients": [
    {
      "name": "ingredient name",
      "quantity": "amount with unit",
      "notes": "optional notes like 'diced' or 'room temperature'"
    }
  ],
  "instructions": "step by step cooking instructions as a single text",
  "steps": [
    {
      "instruction": "individual step instruction",
      "time": "time in minutes as string (e.g., '5') or null if no specific time",
      "imageUrl": null
    }
  ],
  "prepTime": "preparation time (e.g., '15 min')",
  "cookTime": "cooking time (e.g., '30 min')",
  "servings": "number of servings (e.g., '4 servings')"
}

Important rules:
- Create a recipe name that is appetizing and descriptive
- Main ingredients to use: ${ingredients}
${cuisineText}
- You can add common pantry staples (salt, pepper, oil, etc.) if needed to make a complete recipe
- List all ingredients with realistic quantities and measurements
- Include preparation notes where helpful (e.g., 'chopped', 'minced', 'at room temperature')
- IMPORTANT: For ingredients without notes, OMIT the notes field entirely - do not use null
- Write clear, numbered step-by-step instructions in a single paragraph format
- Break down the instructions into individual steps in the "steps" array - each step should be one discrete action
- For each step, include any time mentioned (e.g., "bake for 30 minutes" → time: "30", "simmer for 10 minutes" → time: "10")
- If a step doesn't have a specific time, set time to null
- Always set imageUrl to null in steps (images will be added later by users if needed)
- Provide realistic cooking and preparation times
- Specify the number of servings the recipe makes
- All text should be in ${language}
- Return ONLY valid, complete JSON - ensure all brackets and quotes are closed properly
- Make the recipe practical and achievable for home cooks

Generate the recipe now.`;

    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.7, // Higher creativity for generation vs parsing
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 8192, // Increased for longer recipes with many steps
      },
    });

    const result = await model.generateContent(prompt);
    let text = result.response.text().trim();

    // Clean the response - remove markdown code blocks if present
    text = text.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim();

    // Parse the JSON response
    let generatedRecipe: ParseRecipeResponse;
    try {
      generatedRecipe = JSON.parse(text);
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
          generatedRecipe = JSON.parse(fixedText);
          console.log('Successfully fixed truncated JSON response');
        } catch {
          return res.status(500).json({
            error: 'AI returned incomplete or invalid response format',
            details: text.substring(0, 300),
            suggestion: 'Try with fewer ingredients or simpler cuisine preference'
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
    if (!generatedRecipe.recipeName || !generatedRecipe.ingredients || !generatedRecipe.instructions) {
      return res.status(500).json({
        error: 'AI response missing required fields',
        received: generatedRecipe
      });
    }

    if (generatedRecipe.ingredients.length === 0) {
      return res.status(500).json({ error: 'AI response missing ingredients' });
    }

    // Ensure all ingredients have required fields and normalize notes
    for (const ingredient of generatedRecipe.ingredients) {
      if (!ingredient.name || !ingredient.quantity) {
        return res.status(500).json({
          error: 'Invalid ingredient format in AI response',
          ingredient
        });
      }
      // Normalize null notes to undefined (optional field)
      if (ingredient.notes === null) {
        delete ingredient.notes;
      }
    }

    // Set defaults for optional fields if missing
    generatedRecipe.prepTime = generatedRecipe.prepTime || '';
    generatedRecipe.cookTime = generatedRecipe.cookTime || '';
    generatedRecipe.servings = generatedRecipe.servings || '';

    return res.json(generatedRecipe);

  } catch (error) {
    console.error('Recipe generation API error:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

    return res.status(500).json({
      error: `Failed to generate recipe: ${errorMessage}`
    });
  }
});

export default router;
