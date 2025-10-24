# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

InstaDish is a React Native recipe management app built with Expo. This is a **brownfield migration** from a Next.js web app (originally using Notion API) to a mobile-first React Native app with PostgreSQL/Supabase backend.

**Current Features:**
- **Phase 1:**
  - AI-powered recipe parsing from text/URLs (Google Gemini)
  - Personal recipe database with CRUD operations
  - Grocery lists and shopping lists
  - Authentication with password reset flow
- **Phase 2:**
  - Cooking mode with voice narration (Issue #56)
  - Animated cooking character (Duolingo-style, Issue #57)
  - Screen keep-awake and brightness boost
  - Step-by-step navigation with timers

**Tech Stack:** React Native 0.81.4, Expo 54, TypeScript (strict), Supabase, TanStack Query v5, React Navigation v7, React Native Paper, Lottie React Native

## Commands

```bash
# Development
npm start                    # Start Expo dev server
npm run android              # Run on Android device/emulator
npm run ios                  # Run on iOS device/simulator
npm run web                  # Run web version

# Building with EAS
eas build --platform android --profile development
eas build --platform ios --profile development
eas build --platform all --profile production
```

Note: EAS CLI >= 16.22.0 required. Project ID: `e77e1448-df18-4828-a3ac-9e01fef30b33`

## Architecture

### Authentication (src/hooks/useAuth.tsx)
- **AuthProvider** context manages global auth state
- Supabase Auth with **dual storage strategy**:
  - AsyncStorage: Primary session persistence (handled by Supabase client)
  - Expo Secure Store: Backup token storage for recovery scenarios
- Deep linking for password reset: `instadish://reset-password#access_token=...&refresh_token=...`
- Session restore on app launch via `initializeAuth()`
- Auto-refresh tokens via Supabase `onAuthStateChange` listener

### Navigation (src/navigation/AppNavigator.tsx)
**Three-tier hierarchy:**
1. **App.tsx**: Root conditional rendering
   - AuthScreen (if not authenticated)
   - ResetPasswordScreen (for recovery flow)
   - AppNavigator (if authenticated)
2. **AppNavigator**: Bottom tab navigator with 3 tabs
   - Recipes → RecipesNavigator (stack)
   - Lists → GroceryNavigator (stack)
   - Shopping → ShoppingNavigator (stack)
3. **Stack Navigators**: Each tab contains nested screens

**Navigation Param Lists:**
- `RecipesStackParamList`: RecipesList, RecipeDetail, AddRecipe, EditRecipe
- `GroceryStackParamList`: GroceryLists, GroceryListDetail
- `ShoppingStackParamList`: ShoppingList

### Animated Cooking Character (Issue #57)
**Overview:**
Duolingo-style animated character that provides visual engagement and encouragement during cooking mode. Uses Lottie animations for smooth, performant character states.

**Components:**
- **CookingCharacter** (`src/components/cooking/CookingCharacter.tsx`)
  - Displays Lottie animations with smooth opacity transitions
  - Two position modes: 'inline' (replaces step number badge) or 'absolute' (bottom-right corner)
  - Handles looping vs one-shot animations automatically
  - Pointer events disabled (doesn't block touch interactions)
  - Configurable size (default 100px in inline mode)

**State Management:**
- **useCharacterAnimation** (`src/hooks/useCharacterAnimation.ts`)
  - Animation priority system (Alert > Celebration > Speaking > Idle)
  - One-shot animation support (auto-return to idle after duration)
  - Prevents lower-priority animations from interrupting higher-priority ones

**Animation States:**
```typescript
enum CharacterAnimation {
  Idle,          // Default looping (70% opacity)
  Speaking,      // During voice narration (100% opacity)
  Celebration,   // Final step looping (100% opacity)
  TimerAlert,    // On timer completion (5s one-shot)
}
```

**Animation Triggers:**
- **Idle**: Default state on steps 1 through second-to-last
- **Speaking**: Active only while voice is actually speaking (polled via `isSpeaking()` every 100ms) - takes priority on any step
- **Celebration**: Loops continuously when on the final step (unless speaking)
- **TimerAlert**: One-shot (5s) when timer status becomes `COMPLETED`

**Animation Assets:**
- Location: `src/assets/animations/`
- Format: Lottie JSON (~50-120KB per file)
- Files: `chef-idle.json`, `chef-talking.json`, `chef-celebrate.json`, `chef-alert.json`
- Note: Current animations are simple placeholders - see `src/assets/animations/README.md` for downloading better animations from LottieFiles

**Configuration:**
- Size: 100px (configurable via component prop)
- Position: Inline mode - replaces step number badge at top-center of StepCard
- Z-index: N/A (inline flow with step card)
- Opacity: 0.7 (idle), 1.0 (active animations)

**Integration Points:**
- **StepCard** component receives character via `renderCharacter` prop
- CookingModeScreen monitors:
  - `isNarrating` state → Speaking animation
  - Timer context → TimerAlert on completion
  - Step navigation → Celebration animation
- Animations preloaded on screen mount for smooth transitions
- Character replaces the round orange step number badge in cooking mode

### Database Schema (Supabase PostgreSQL)

See `docs/supabase-schema.sql` for complete schema.

**Security:**
- RLS (Row Level Security) enabled on all tables
- All queries automatically filtered by `auth.uid() = user_id`
- Cascade deletes clean up related records automatically

**Performance:**
- Indexes on: user_id, created_at DESC, name, status
- Auto-update triggers for updated_at timestamps

**Note:** Use snake_case in database queries, but TypeScript types use camelCase

## Environment Configuration

**Required variables** (via Expo Constants or .env):
- `EXPO_PUBLIC_SUPABASE_URL`: Supabase project URL
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`: Supabase anonymous key
- `EXPO_PUBLIC_API_BASE_URL`: Backend API for AI parsing

## Coding Standards

### Naming Conventions
- **camelCase**: variables, functions
- **PascalCase**: components, interfaces
- **UPPER_SNAKE_CASE**: global constants
- Boolean names: prefix with `is`, `has`, `should`
- Screen components: suffix with `Screen`
- Props interfaces: suffix with `Props`

### Component Structure Order
1. Imports (React → Third-party → Internal types → Internal components → Relative → Styles)
2. Types/Interfaces
3. Component definition
4. Hooks
5. Handlers
6. Render
7. Styles (StyleSheet.create)

### React Native
- **Functional components only** with hooks (no classes)
- **Named exports** preferred over default exports
- Use `React.memo()`, `useCallback()`, `useMemo()` for performance
- Use `StyleSheet.create()` for styles (not inline styles)
- Follow React hooks rules (no conditionals, correct dependencies)

## Common Gotchas

1. **Supabase naming**: Database uses snake_case (recipe_name), TypeScript uses camelCase (recipeName)
2. **User ID**: Always get from `supabase.auth.getUser()` not session object (for freshness)
3. **Recipe updates**: Must delete and recreate junction records, not update in place
4. **Dual storage**: Auth tokens stored in both AsyncStorage and SecureStore for redundancy
5. **Navigation typing**: Use strict param lists exported from AppNavigator.tsx
6. **RLS policies**: Don't manually add user_id filters - RLS handles this automatically
7. **Ingredient uniqueness**: Service layer automatically handles finding/creating by name
8. **Junction table dupes**: Attempting to link same recipe-ingredient twice silently fails (by design, error code '23505')
9. **Image URLs**: Optional field, stored as nullable string
10. **Expo config**: Use Constants.expoConfig for runtime access to app.json extras

## Deep Linking

App scheme: `instadish://`

Configured in app.json for iOS universal links and Android intent filters.

**Password reset flow:**
1. User requests reset → Email sent with link to `instadish://reset-password#access_token=...&refresh_token=...`
2. App.tsx handles deep link via `Linking.getInitialURL()` and `Linking.addEventListener()`
3. Extracts tokens from hash params
4. Calls `verifyRecoveryToken()` to establish session
5. Shows ResetPasswordScreen for new password

## Additional Documentation

Comprehensive docs in `docs/`:

## Testing

Test Supabase connection: See src/services/testSupabaseConnection.ts

Test AI API health:
```typescript
await aiParsingService.checkApiHealth()
```
