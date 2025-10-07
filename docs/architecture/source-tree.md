# InstaDish React Native - Source Tree

## Project Structure

```
InstaDishReact/
├── .expo/                      # Expo build cache (gitignored)
├── .git/                       # Git repository
├── assets/                     # Static assets
│   ├── icon.png               # App icon
│   ├── splash.png             # Splash screen
│   └── adaptive-icon.png      # Android adaptive icon
│
├── docs/                       # Project documentation
│   └── architecture/          # Architecture docs
│       ├── tech-stack.md      # Technology stack
│       ├── source-tree.md     # This file
│       └── coding-standards.md # Code standards
│
├── node_modules/              # Dependencies (gitignored)
│
├── src/                       # Source code
│   ├── components/            # Reusable UI components
│   │   ├── shared/           # Shared components
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Card.tsx
│   │   │   └── LoadingSpinner.tsx
│   │   ├── recipes/          # Recipe-specific components
│   │   │   ├── RecipeCard.tsx
│   │   │   └── IngredientsList.tsx
│   │   └── grocery/          # Grocery-specific components
│   │       ├── GroceryListCard.tsx
│   │       └── GroceryItemCheckbox.tsx
│   │
│   ├── config/               # App configuration
│   │   ├── constants.ts      # App constants
│   │   └── queryClient.ts    # React Query config
│   │
│   ├── hooks/                # Custom React hooks
│   │   ├── useAuth.ts        # Authentication hook
│   │   ├── useRecipes.ts     # Recipe data hooks
│   │   └── useGroceryLists.ts # Grocery list hooks
│   │
│   ├── navigation/           # Navigation structure
│   │   └── AppNavigator.tsx  # Main navigation config
│   │
│   ├── screens/              # Screen components
│   │   ├── recipes/          # Recipe screens
│   │   │   ├── RecipesListScreen.tsx
│   │   │   ├── RecipeDetailScreen.tsx
│   │   │   └── AddRecipeScreen.tsx
│   │   ├── grocery/          # Grocery screens
│   │   │   ├── GroceryListsScreen.tsx
│   │   │   ├── GroceryListDetailScreen.tsx
│   │   │   ├── CreateGroceryListScreen.tsx
│   │   │   └── ShoppingListScreen.tsx
│   │   └── shared/           # Shared screens
│   │       ├── AuthScreen.tsx
│   │       └── SplashScreen.tsx
│   │
│   ├── services/             # API & business logic
│   │   ├── supabase.ts       # Supabase client
│   │   ├── api.ts            # Generic API utilities
│   │   ├── recipeService.ts  # Recipe CRUD operations
│   │   ├── groceryService.ts # Grocery list operations
│   │   ├── aiParsingService.ts # AI recipe parsing
│   │   └── testSupabaseConnection.ts # Connection testing
│   │
│   ├── types/                # TypeScript type definitions
│   │   └── index.ts          # Shared types
│   │
│   └── utils/                # Helper functions
│       ├── storage.ts        # AsyncStorage helpers
│       └── validation.ts     # Form validation
│
├── .env                      # Environment variables (gitignored)
├── .env.example              # Example env file
├── .gitignore               # Git ignore rules
├── app.json                 # Expo configuration
├── App.tsx                  # Root component
├── index.ts                 # App entry point
├── package.json             # Dependencies
├── package-lock.json        # Dependency lock file
└── tsconfig.json            # TypeScript config
```

## Directory Purposes

### Root Level
- **App.tsx** - Root React component, app initialization
- **index.ts** - Entry point, registers root component
- **app.json** - Expo app configuration (name, version, icons)
- **.env** - Environment variables (API keys, Supabase credentials)

### `/src/components/`
Reusable UI components organized by domain:
- **shared/** - Generic components used across app
- **recipes/** - Recipe-specific UI components
- **grocery/** - Grocery list-specific components

### `/src/config/`
Application-wide configuration:
- Constants (API URLs, timeouts)
- React Query client setup
- Feature flags

### `/src/hooks/`
Custom React hooks for shared logic:
- Data fetching hooks (useRecipes, useGroceryLists)
- Authentication hooks (useAuth)
- Form hooks
- Business logic hooks

### `/src/navigation/`
React Navigation configuration:
- Tab navigator setup
- Stack navigators for each feature
- Deep linking configuration
- Navigation types

### `/src/screens/`
Full-screen components organized by feature:
- One file per screen
- Screen-specific state management
- Connected to navigation
- Composed from components

### `/src/services/`
API clients and business logic:
- **supabase.ts** - Supabase client initialization
- **recipeService.ts** - Recipe CRUD operations
- **groceryService.ts** - Grocery list operations
- **aiParsingService.ts** - AI recipe parsing API calls

### `/src/types/`
TypeScript type definitions:
- API request/response types
- Domain models (Recipe, Ingredient, GroceryList)
- Navigation parameter types
- Utility types

### `/src/utils/`
Helper functions and utilities:
- Storage helpers (AsyncStorage wrappers)
- Validation functions
- Formatters
- Date/time utilities

### `/docs/`
Project documentation:
- Architecture decisions
- API documentation
- Development guides
- Deployment instructions

## Naming Conventions

### Files
- **Components**: PascalCase (e.g., `RecipeCard.tsx`)
- **Hooks**: camelCase with 'use' prefix (e.g., `useRecipes.ts`)
- **Services**: camelCase with 'Service' suffix (e.g., `recipeService.ts`)
- **Utils**: camelCase (e.g., `validation.ts`)
- **Types**: camelCase (e.g., `index.ts`)

### Folders
- lowercase or kebab-case
- Descriptive, feature-based names
- Grouped by domain (recipes, grocery, shared)

## Import Paths
Use absolute imports where configured:
```typescript
import { Recipe } from '@/types';
import { recipeService } from '@/services/recipeService';
```

## Generated Files (Gitignored)
- `node_modules/` - NPM dependencies
- `.expo/` - Expo cache
- `.env` - Environment variables
- `*.tsbuildinfo` - TypeScript build info
- `/ios`, `/android` - Generated native folders (if ejected)

## Key Dependencies Location
- **Package management**: `package.json`
- **TypeScript config**: `tsconfig.json`
- **Expo config**: `app.json`
- **Environment**: `.env`, `.env.example`
