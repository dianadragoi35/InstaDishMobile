# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

InstaDish is a React Native recipe management app built with Expo. This is a **brownfield migration** from a Next.js web app (originally using Notion API) to a mobile-first React Native app with PostgreSQL/Supabase backend.

**Current Features (Phase 1):**
- AI-powered recipe parsing from text/URLs (Google Gemini)
- Personal recipe database with CRUD operations
- Grocery lists and shopping lists
- Authentication with password reset flow

**Tech Stack:** React Native 0.81.4, Expo 54, TypeScript (strict), Supabase, TanStack Query v5, React Navigation v7, React Native Paper

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
