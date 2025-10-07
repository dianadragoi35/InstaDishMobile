# InstaDish React Native - Coding Standards

## TypeScript Standards

### Type Safety
- **Always use TypeScript** - No `.js` or `.jsx` files
- **Enable strict mode** - `"strict": true` in tsconfig.json
- **No `any` types** - Use proper types or `unknown` if truly dynamic
- **Explicit return types** - For all functions (except simple arrow functions)
- **Interface over Type** - Use `interface` for object shapes, `type` for unions/intersections

```typescript
// ✅ Good
interface Recipe {
  id: string;
  recipeName: string;
  ingredients: Ingredient[];
}

async function getRecipes(): Promise<Recipe[]> {
  // ...
}

// ❌ Bad
function getRecipes(): any {
  // ...
}
```

### Null Safety
- Use optional chaining `?.` and nullish coalescing `??`
- Always handle null/undefined cases
- Use type guards for runtime checks

```typescript
// ✅ Good
const recipeName = recipe?.recipeName ?? 'Untitled';

if (!recipe) {
  return null;
}

// ❌ Bad
const recipeName = recipe.recipeName || 'Untitled';
```

## React/React Native Standards

### Component Structure
- **Functional components** with hooks (no class components)
- **Named exports** for components
- **Props interface** defined above component

```typescript
// ✅ Good
interface RecipeCardProps {
  recipe: Recipe;
  onPress: () => void;
}

export function RecipeCard({ recipe, onPress }: RecipeCardProps) {
  // Component logic
}

// ❌ Bad
export default ({ recipe, onPress }: any) => {
  // Component logic
}
```

### Hooks Rules
- Follow React hooks rules (use `eslint-plugin-react-hooks`)
- Custom hooks must start with `use`
- Keep hooks at top level (no conditionals)
- Declare dependencies correctly in useEffect/useCallback

```typescript
// ✅ Good
function useRecipes() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);

  useEffect(() => {
    loadRecipes();
  }, []);

  return { recipes };
}

// ❌ Bad
function getRecipes() { // Missing 'use' prefix
  if (condition) {
    const [data, setData] = useState([]); // Hook in conditional
  }
}
```

### State Management
- **Local state** - `useState` for component-specific state
- **Server state** - React Query for API data
- **Derived state** - `useMemo` for expensive computations
- **Side effects** - `useEffect` with proper dependencies

### Component Organization
```typescript
// 1. Imports
import { useState } from 'react';
import { View, Text } from 'react-native';
import { Recipe } from '@/types';

// 2. Types/Interfaces
interface RecipeCardProps {
  recipe: Recipe;
}

// 3. Component
export function RecipeCard({ recipe }: RecipeCardProps) {
  // 4. Hooks
  const [expanded, setExpanded] = useState(false);

  // 5. Handlers
  const handlePress = () => setExpanded(!expanded);

  // 6. Render
  return (
    <View>
      <Text>{recipe.recipeName}</Text>
    </View>
  );
}

// 7. Styles (if using StyleSheet)
const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
});
```

## Naming Conventions

### Variables & Functions
- **camelCase** for variables and functions
- **Descriptive names** - avoid abbreviations
- **Boolean names** - prefix with `is`, `has`, `should`

```typescript
// ✅ Good
const isLoading = false;
const hasIngredients = recipe.ingredients.length > 0;
const shouldShowModal = !isLoading && hasData;

async function createRecipe(data: CreateRecipeRequest) {
  // ...
}

// ❌ Bad
const loading = false;
const ingredients = recipe.ingredients.length > 0; // Confusing name
async function create(data: any) { // Too generic
  // ...
}
```

### Components
- **PascalCase** for component names
- **Descriptive names** - include domain (Recipe, Grocery)
- **Screen suffix** for screen components
- **Props suffix** for prop interfaces

```typescript
// ✅ Good
interface RecipeCardProps { }
export function RecipeCard() { }

interface AddRecipeScreenProps { }
export function AddRecipeScreen() { }

// ❌ Bad
interface Props { }  // Too generic
export function card() { }  // Wrong case
export function Screen() { }  // Too generic
```

### Constants
- **UPPER_SNAKE_CASE** for global constants
- Group related constants in objects

```typescript
// ✅ Good
const API_BASE_URL = 'https://api.example.com';
const MAX_RETRY_ATTEMPTS = 3;

const QueryKeys = {
  RECIPES: 'recipes',
  GROCERY_LISTS: 'grocery-lists',
} as const;

// ❌ Bad
const apiUrl = 'https://api.example.com';
const recipes = 'recipes'; // Unclear if constant
```

## File Organization

### Import Order
1. React/React Native
2. Third-party libraries
3. Internal types
4. Internal components/hooks/services
5. Relative imports
6. Styles

```typescript
// ✅ Good
import React, { useState } from 'react';
import { View, Text } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Button } from 'react-native-paper';

import { Recipe } from '@/types';
import { useRecipes } from '@/hooks/useRecipes';
import { RecipeCard } from '@/components/recipes/RecipeCard';

import { styles } from './styles';

// ❌ Bad - Random order
import { styles } from './styles';
import { Recipe } from '@/types';
import { View } from 'react-native';
import React from 'react';
```

### Export Patterns
- **Named exports** preferred over default exports
- One component per file
- Export types/interfaces used by consumers

```typescript
// ✅ Good
export interface Recipe { }
export function RecipeCard() { }

// ❌ Bad
export default function RecipeCard() { } // Default export
export function RecipeCard() { }
export function OtherComponent() { } // Multiple components
```

## Code Quality

### DRY (Don't Repeat Yourself)
- Extract repeated logic into hooks
- Create reusable components
- Use utility functions for common operations

### Error Handling
- Always handle errors from async operations
- Provide user-friendly error messages
- Log errors for debugging

```typescript
// ✅ Good
try {
  const recipe = await recipeService.createRecipe(data);
  Alert.alert('Success', 'Recipe created!');
  return recipe;
} catch (error) {
  console.error('Failed to create recipe:', error);
  Alert.alert('Error', 'Failed to create recipe. Please try again.');
  throw error;
}

// ❌ Bad
const recipe = await recipeService.createRecipe(data); // No error handling
```

### Comments
- **JSDoc** for public APIs and complex functions
- **Inline comments** for non-obvious logic
- **TODO comments** for temporary code
- Avoid obvious comments

```typescript
// ✅ Good
/**
 * Parses recipe text using AI and extracts structured data
 * @param recipeText - Raw recipe text to parse
 * @returns Structured recipe data with ingredients
 */
async function parseRecipe(recipeText: string): Promise<ParsedRecipe> {
  // Use Gemini API for parsing complex recipe formats
  const result = await aiService.parse(recipeText);
  return result;
}

// ❌ Bad
// This function creates a recipe
async function createRecipe(data: any) { // Obvious comment, any type
  // Loop through ingredients
  for (const ing of data.ingredients) { // Obvious comment
    // ...
  }
}
```

## React Native Specific

### Styling
- Use `StyleSheet.create()` for styles
- Group styles at bottom of file
- Use theme constants for colors/spacing

```typescript
// ✅ Good
import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
  },
});

// ❌ Bad
<View style={{ flex: 1, padding: 16 }}> // Inline styles
```

### Platform-Specific Code
- Use `Platform.select()` for platform differences
- Extract platform-specific code into utilities

```typescript
// ✅ Good
import { Platform } from 'react-native';

const fontSize = Platform.select({
  ios: 16,
  android: 14,
});

// ❌ Bad
const fontSize = Platform.OS === 'ios' ? 16 : 14;
```

### Performance
- Use `React.memo()` for expensive components
- Use `useCallback()` for function props
- Use `useMemo()` for expensive computations
- Avoid unnecessary re-renders

```typescript
// ✅ Good
const RecipeCard = React.memo(({ recipe, onPress }: RecipeCardProps) => {
  const handlePress = useCallback(() => {
    onPress(recipe.id);
  }, [recipe.id, onPress]);

  return <Pressable onPress={handlePress}>...</Pressable>;
});

// ❌ Bad
function RecipeCard({ recipe, onPress }: RecipeCardProps) {
  return <Pressable onPress={() => onPress(recipe.id)}>...</Pressable>;
  // Creates new function on every render
}
```

## Testing (Future)

### Test File Naming
- `ComponentName.test.tsx` for component tests
- `functionName.test.ts` for utility tests
- Co-locate tests with source files

### Test Structure
- Arrange, Act, Assert pattern
- Descriptive test names
- One assertion per test (when possible)

## Async/Await
- **Always use async/await** over promises
- Handle errors with try/catch
- Use Promise.all for parallel operations

```typescript
// ✅ Good
async function loadRecipeData(recipeId: string) {
  try {
    const [recipe, ingredients] = await Promise.all([
      recipeService.getRecipe(recipeId),
      recipeService.getIngredients(recipeId),
    ]);
    return { recipe, ingredients };
  } catch (error) {
    console.error('Failed to load recipe:', error);
    throw error;
  }
}

// ❌ Bad
function loadRecipeData(recipeId: string) {
  return recipeService.getRecipe(recipeId)
    .then(recipe => recipeService.getIngredients(recipeId)
      .then(ingredients => ({ recipe, ingredients })));
}
```

## Environment Variables
- Prefix with `EXPO_PUBLIC_` for client-side access
- Never commit `.env` file
- Use `expo-constants` to access variables

```typescript
// ✅ Good
import Constants from 'expo-constants';

const apiUrl = Constants.expoConfig?.extra?.apiUrl
  || process.env.EXPO_PUBLIC_API_URL;

// ❌ Bad
const apiUrl = process.env.API_URL; // Missing EXPO_PUBLIC_ prefix
```

## Git Commit Messages
- Use conventional commits format
- Present tense, imperative mood
- Include scope when relevant

```
feat(recipes): add recipe parsing with AI
fix(auth): resolve token refresh issue
docs(architecture): update tech stack
refactor(services): extract common API logic
```

## Code Review Checklist
- [ ] TypeScript strict mode compliance
- [ ] Proper error handling
- [ ] No console.log in production code
- [ ] Responsive design for different screen sizes
- [ ] Accessibility considerations
- [ ] Performance optimizations applied
- [ ] Tests written (when applicable)
- [ ] Documentation updated
