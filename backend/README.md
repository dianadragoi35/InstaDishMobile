# InstaDish Mobile Backend

Node.js/Express backend server for the InstaDish React Native mobile app. Provides AI-powered recipe parsing using Google Gemini.

## Features

- 🤖 AI recipe parsing with Google Gemini
- 🌐 CORS enabled for mobile app
- 🔄 Auto-reload development mode
- ✅ Health check endpoint
- 🛡️ TypeScript for type safety

## Tech Stack

- **Express** 4.21.2 - Web framework
- **Google Gemini AI** (@google/genai 1.19.0) - AI recipe parsing
- **CORS** 2.8.5 - Cross-origin requests
- **TypeScript** 5.7.2 - Type safety
- **tsx** 4.19.2 - TypeScript execution & watch mode

## Prerequisites

- Node.js 18+ installed
- Google Gemini API key ([Get one here](https://makersuite.google.com/app/apikey))

## Installation

```bash
cd backend
npm install
```

## Configuration

1. Copy the example environment file:
```bash
cp .env.example .env
```

2. Edit `.env` and add your Gemini API key:
```bash
GEMINI_API_KEY=your-actual-api-key-here
PORT=3000
NODE_ENV=development
```

## Running the Server

### Development Mode (with auto-reload)
```bash
npm run dev
```

### Production Build
```bash
npm run build
npm start
```

## API Endpoints

### Health Check
Check if the server is running.

**Endpoint**: `GET /health`

**Response**:
```json
{
  "status": "ok",
  "message": "InstaDish Mobile Backend is running"
}
```

**Example**:
```bash
curl http://localhost:3000/health
```

---

### Parse Recipe
Parse recipe text using Google Gemini AI.

**Endpoint**: `POST /api/recipes/parse`

**Headers**:
```
Content-Type: application/json
```

**Request Body**:
```json
{
  "recipeText": "Spaghetti Carbonara: 400g spaghetti, 200g bacon, 4 eggs, 100g parmesan, salt and pepper. Cook pasta. Fry bacon. Mix eggs and cheese. Combine all. Serves 4. Prep 10 min, Cook 15 min.",
  "language": "English"
}
```

**Response** (Success - 200):
```json
{
  "recipeName": "Spaghetti Carbonara",
  "ingredients": [
    {
      "name": "spaghetti",
      "quantity": "400g",
      "notes": ""
    },
    {
      "name": "bacon",
      "quantity": "200g",
      "notes": ""
    },
    {
      "name": "eggs",
      "quantity": "4",
      "notes": ""
    },
    {
      "name": "parmesan",
      "quantity": "100g",
      "notes": "grated"
    },
    {
      "name": "salt",
      "quantity": "to taste",
      "notes": ""
    },
    {
      "name": "pepper",
      "quantity": "to taste",
      "notes": ""
    }
  ],
  "instructions": "Cook the pasta according to package directions. While pasta cooks, fry the bacon until crispy. In a bowl, mix eggs and grated parmesan cheese. Drain pasta and combine with bacon. Remove from heat and quickly stir in egg mixture. Season with salt and pepper to taste.",
  "prepTime": "10 min",
  "cookTime": "15 min",
  "servings": "4 servings"
}
```

**Response** (Error - 400):
```json
{
  "error": "Recipe text is required"
}
```

**Response** (Error - 500):
```json
{
  "error": "Failed to parse recipe: AI returned invalid response format"
}
```

**Example**:
```bash
curl -X POST http://localhost:3000/api/recipes/parse \
  -H "Content-Type: application/json" \
  -d '{
    "recipeText": "Spaghetti Carbonara: 400g spaghetti, 200g bacon, 4 eggs, 100g parmesan, salt and pepper. Cook pasta. Fry bacon. Mix eggs and cheese. Combine all. Serves 4. Prep 10 min, Cook 15 min.",
    "language": "English"
  }'
```

## API Parameters

### Parse Recipe Request

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `recipeText` | string | Yes | Raw recipe text to parse |
| `language` | string | No | Language for parsing (default: "English") |

### Parse Recipe Response

| Field | Type | Description |
|-------|------|-------------|
| `recipeName` | string | Name of the recipe |
| `ingredients` | array | List of ingredient objects |
| `ingredients[].name` | string | Ingredient name |
| `ingredients[].quantity` | string | Amount with unit |
| `ingredients[].notes` | string | Optional notes (e.g., "diced", "room temperature") |
| `instructions` | string | Step-by-step cooking instructions |
| `prepTime` | string | Preparation time (e.g., "15 min") |
| `cookTime` | string | Cooking time (e.g., "30 min") |
| `servings` | string | Number of servings (e.g., "4 servings") |

## Error Handling

The API returns appropriate HTTP status codes:

- `200` - Success
- `400` - Bad Request (missing or invalid parameters)
- `500` - Internal Server Error (AI parsing failed, configuration issues)

All error responses include an `error` field with a descriptive message:
```json
{
  "error": "Description of what went wrong"
}
```

## Project Structure

```
backend/
├── src/
│   ├── index.ts          # Express server entry point
│   └── routes/
│       └── recipes.ts    # Recipe parsing endpoint
├── dist/                 # Compiled JavaScript (generated)
├── .env                  # Environment variables (not in git)
├── .env.example          # Environment template
├── .gitignore           # Git ignore rules
├── package.json         # Dependencies
├── tsconfig.json        # TypeScript configuration
└── README.md            # This file
```

## Development

### Auto-reload
The development server uses `tsx watch` for automatic reloading:
```bash
npm run dev
```

Any changes to `.ts` files will automatically restart the server.

### TypeScript Compilation
To compile TypeScript to JavaScript:
```bash
npm run build
```

Compiled files will be in the `dist/` directory.

## Deployment

### Environment Variables
Ensure these environment variables are set in production:

```bash
GEMINI_API_KEY=your-production-api-key
PORT=3000
NODE_ENV=production
```

### Starting in Production
```bash
npm run build
npm start
```

## Troubleshooting

### "AI service is not configured"
**Issue**: `GEMINI_API_KEY` environment variable is not set.

**Solution**:
1. Copy `.env.example` to `.env`
2. Add your Gemini API key
3. Restart the server

### "Method doesn't allow unregistered callers"
**Issue**: Invalid or missing Gemini API key.

**Solution**:
1. Get a new API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Update `.env` with the new key
3. Restart the server

### CORS Errors from Mobile App
**Issue**: Mobile app can't connect to backend.

**Solution**:
1. Ensure backend is running on the correct IP (not `localhost`)
2. Update mobile app `.env`:
   ```
   EXPO_PUBLIC_API_BASE_URL=http://YOUR_LOCAL_IP:3000/api
   ```
3. Restart Expo dev server

### "Connection refused"
**Issue**: Backend server is not running.

**Solution**:
```bash
cd backend
npm run dev
```

## Testing

### Health Check
```bash
curl http://localhost:3000/health
```

Expected output:
```json
{"status":"ok","message":"InstaDish Mobile Backend is running"}
```

### Recipe Parsing
```bash
curl -X POST http://localhost:3000/api/recipes/parse \
  -H "Content-Type: application/json" \
  -d '{"recipeText":"Pasta with tomato sauce: 200g pasta, 400g tomatoes, garlic, olive oil. Cook pasta. Make sauce. Combine.","language":"English"}'
```

Should return a parsed recipe object.

## Security Notes

- **Never commit `.env` to git** - It's in `.gitignore`
- **Keep API keys secret** - Don't share or expose them
- **Use environment variables** - Never hardcode secrets in code
- **CORS is enabled** - In production, consider restricting to specific origins

## Mobile App Integration

### Environment Setup
In the mobile app's `.env`:
```bash
# For iOS Simulator
EXPO_PUBLIC_API_BASE_URL=http://127.0.0.1:3000/api

# For Android Emulator
EXPO_PUBLIC_API_BASE_URL=http://10.0.2.2:3000/api

# For Physical Device (use your computer's local IP)
EXPO_PUBLIC_API_BASE_URL=http://192.168.X.X:3000/api
```

Find your local IP:
- Mac/Linux: `ifconfig | grep "inet "`
- Windows: `ipconfig`

### Service Integration
The mobile app's `aiParsingService.ts` automatically calls this backend:
```typescript
const response = await fetch(`${API_BASE_URL}/recipes/parse`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ recipeText, language })
});
```

## License

MIT

## Support

For issues or questions:
1. Check this README
2. Review error messages in console
3. Verify environment configuration
4. Check Gemini API key validity

---

**Backend Version**: 1.0.0
**Last Updated**: 2025-10-07
