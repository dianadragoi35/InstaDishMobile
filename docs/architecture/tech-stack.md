# InstaDish React Native - Tech Stack

## Overview
InstaDish Mobile is a cross-platform mobile application built with React Native and Expo, providing recipe management and grocery list functionality.

## Core Technologies

### Frontend Framework
- **React Native** `0.81.4` - Cross-platform mobile development framework
- **React** `19.1.0` - UI library
- **Expo** `~54.0.12` - Managed workflow for React Native
- **TypeScript** `~5.9.2` - Type-safe JavaScript

### Navigation
- **@react-navigation/native** `^7.1.17` - Navigation framework
- **@react-navigation/bottom-tabs** `^7.4.7` - Bottom tab navigation
- **@react-navigation/native-stack** `^7.3.26` - Stack navigation
- **react-native-screens** `^4.16.0` - Native screen primitives
- **react-native-safe-area-context** `^5.6.1` - Safe area handling

### Backend & Data
- **Supabase** - PostgreSQL database + Auth + Storage
  - **@supabase/supabase-js** `^2.58.0` - Supabase client
  - Row Level Security (RLS) for data isolation
  - Email/password authentication
- **@tanstack/react-query** `^5.90.2` - Data fetching & caching
- **@react-native-async-storage/async-storage** `^2.2.0` - Local storage

### UI Components & Styling
- **react-native-paper** `^5.14.5` - Material Design components
- **react-native-vector-icons** `^10.3.0` - Icon library
- **expo-status-bar** `~3.0.8` - Status bar component

### Forms & Validation
- **react-hook-form** `^7.63.0` - Form state management

### Media & Assets
- **expo-image-picker** `~17.0.8` - Image selection from camera/gallery
- **expo-image** - Optimized image component (via Expo)

### Environment & Configuration
- **expo-constants** `~18.0.9` - Access to system constants
- **expo-secure-store** `~15.0.7` - Secure credential storage
- **react-native-url-polyfill** `^3.0.0` - URL API polyfill

### AI/ML Integration
- **Google Gemini API** - Recipe text parsing and extraction
  - **@google/genai** `^1.19.0` - Gemini SDK
  - Backend API endpoint for AI processing (`/api/recipes/parse`)
  - Recipe ingredient extraction
  - Cooking instruction parsing
  - Model: `gemini-2.5-flash`

## Development Tools

### Language & Type Checking
- **TypeScript** `~5.9.2`
- **@types/react** `~19.1.0`
- Strict mode enabled

### Build & Deployment
- **Expo CLI** - Development and build tooling
- **EAS Build** - Cloud-based build service
- **Expo Go** - Development client

## Target Platforms
- **iOS** - iPhone and iPad
- **Android** - Android phones and tablets

## Backend Architecture

### Database (Supabase/PostgreSQL)
Tables:
- `recipes` - Recipe metadata (with RLS policies)
- `ingredients` - User's ingredient catalog
- `recipe_ingredients` - Recipe-ingredient junction
- `grocery_lists` - Shopping lists
- `grocery_list_items` - List items

Constraints:
- `prep_time`, `cook_time`, `servings`: varchar(50)
- Row Level Security (RLS) enabled on all tables
- User-based data isolation

### Authentication
- **Simple Auth Implementation** (for testing)
  - Email/password via Supabase Auth
  - Sign up and login screens
  - Auto-refresh tokens
  - Persistent sessions with AsyncStorage
  - Real-time auth state sync

### API Structure

**Mobile Backend Server** (Node.js/Express)
- Port: 3000
- CORS enabled for mobile app
- Endpoints:
  - `GET /health` - Health check
  - `POST /api/recipes/parse` - AI recipe parsing

**Supabase**
- REST API (auto-generated)
- Real-time subscriptions (future)

**Tech Stack**
- Express 4.21.2
- @google/genai 1.19.0
- CORS 2.8.5
- TypeScript 5.7.2

## Security
- Row Level Security (RLS) policies
- Environment variables for API keys
- `.env` excluded from version control
- Secure token storage

## State Management Strategy
- **Server State**: React Query (API data, caching)
- **Local State**: React hooks (useState, useReducer)
- **Persistent State**: AsyncStorage (auth tokens, preferences)

## Code Organization
```
InstaDishReact/
├── src/
│   ├── components/     # Reusable UI components
│   ├── config/        # App configuration
│   ├── hooks/         # Custom React hooks (useRecipes, etc.)
│   ├── navigation/    # Navigation structure
│   ├── screens/       # Screen components
│   │   ├── auth/      # AuthScreen
│   │   ├── recipes/   # Recipe screens
│   │   └── grocery/   # Grocery list screens
│   ├── services/      # API & business logic
│   │   ├── supabase.ts           # Supabase client
│   │   ├── recipeService.ts      # Recipe CRUD
│   │   ├── groceryService.ts     # Grocery lists
│   │   └── aiParsingService.ts   # AI parsing
│   ├── types/         # TypeScript definitions
│   └── utils/         # Helper functions
├── backend/           # Node.js/Express backend
│   ├── src/
│   │   ├── index.ts           # Server entry point
│   │   └── routes/
│   │       └── recipes.ts     # Parse endpoint
│   ├── package.json
│   └── tsconfig.json
├── docs/              # Documentation
│   ├── architecture/  # Tech stack, design docs
│   └── qa/           # QA assessments, action plans
├── App.tsx           # Root component with auth
└── package.json
```

## Performance Considerations
- React Query caching (5-minute stale time)
- Image optimization via expo-image
- Lazy loading for screens
- Memoization for expensive computations

## Future Enhancements
- Offline support with React Query persistence
- Real-time collaboration (Supabase Realtime)
- Push notifications (Expo Notifications)
- Image optimization and CDN
- Analytics integration
