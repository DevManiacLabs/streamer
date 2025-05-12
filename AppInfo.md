# FreeFlix - Streaming Platform Documentation

## Overview
FreeFlix is a Netflix-like streaming platform that allows users to browse and stream movies and TV shows. The application uses the TMDB API for content metadata and the VidSrc API for streaming. It is built with Next.js, React, and TypeScript, providing a responsive and performant user experience.

## Table of Contents
- [Architecture](#architecture)
- [Directory Structure](#directory-structure)
- [Core Technologies](#core-technologies)
- [API Integrations](#api-integrations)
- [Component Structure](#component-structure)
- [Authentication](#authentication)
- [Data Management](#data-management)
- [Routing](#routing)
- [Features](#features)
- [Development Tools](#development-tools)

## Architecture

### Frontend
The application follows a component-based architecture using React and Next.js. It leverages the App Router pattern from Next.js for routing and uses React Query for data fetching and caching. The UI is built with Tailwind CSS for responsive styling.

### Backend
The backend functionality is implemented via Next.js API routes, which provide server-side capabilities for authentication, data fetching, and user data management. For development, the application uses a file-based storage system, but it's designed to be compatible with MongoDB for production use.

### Data Flow
1. UI components request data through custom hooks
2. Custom hooks use React Query to manage data fetching, caching, and state
3. React Query interacts with external APIs through API wrapper modules
4. Server-side API routes handle authenticated requests and proxy external API calls

## Directory Structure

```
freeFlix/
├── public/                # Static assets
├── src/
│   ├── api/               # API integration layer
│   │   ├── tmdb.ts        # The Movie Database API integration
│   │   ├── vidsrc.ts      # VidSrc streaming API integration
│   │   └── mongodb.ts     # MongoDB database integration
│   ├── app/               # Next.js App Router pages
│   │   ├── api/           # API routes for server-side functionality
│   │   ├── movie/         # Movie detail pages
│   │   ├── tv/            # TV show pages
│   │   ├── login/         # Authentication pages
│   │   ├── signup/        # User registration
│   │   ├── profile/       # User profile management
│   │   ├── search/        # Search functionality
│   │   └── watch-history/ # User's watch history
│   ├── components/        # Reusable UI components
│   │   ├── ui/            # Core UI components (Button, Card, etc.)
│   │   ├── features/      # Feature-specific components
│   │   ├── layout/        # Layout components
│   │   └── auth/          # Authentication components
│   ├── hooks/             # Custom React hooks
│   │   ├── useTMDB.ts     # TMDB data fetching hooks
│   │   ├── useVidSrc.ts   # VidSrc API hooks
│   │   └── useWatchHistory.ts # Watch history management
│   ├── lib/               # Utility functions and helpers
│   │   ├── config.ts      # Centralized configuration
│   │   ├── utils.ts       # Utility functions
│   │   └── auth.ts        # Authentication helpers
│   ├── types/             # TypeScript type definitions
│   └── middleware.ts      # Next.js middleware for auth & routing
├── scripts/               # Utility scripts for data initialization
```

## Core Technologies

- **Framework**: Next.js 14.x (React 18.x)
- **Language**: TypeScript
- **Data Fetching**: React Query (TanStack Query)
- **Styling**: Tailwind CSS
- **Authentication**: NextAuth.js
- **Database**: MongoDB (File-based storage for development)
- **State Management**: React Query + React Context

## API Integrations

### TMDB API
- Provides movie and TV show metadata, images, and details
- Implementation in `src/api/tmdb.ts`
- Accessed via custom hooks in `src/hooks/useTMDB.ts`
- Cached according to the configuration in `src/lib/config.ts`

### VidSrc API
- Provides video streaming capabilities
- Implementation in `src/api/vidsrc.ts`
- Accessed via custom hooks in `src/hooks/useVidSrc.ts`
- Supports multiple domains for reliability

## Component Structure

### UI Components
- **Layout**: Global app layout, navigation, footer
- **Cards**: Content display cards for movies and TV shows
- **Hero Sections**: Featured content with backdrop images
- **Content Rows**: Horizontal scrollable rows of content
- **Player**: Video player for streaming content
- **Mobile Navigation**: Dropdown menu for mobile devices

### Feature Components
- **SearchBar**: Multi-type search functionality
- **ContinueWatching**: Shows user's recent viewing history
- **UserMenu**: Account management dropdown
- **ContentDetails**: Detailed information about movies/shows

## Authentication

### User Authentication Flow
1. Users register or sign in through the login/signup pages
2. NextAuth.js handles authentication state and session management
3. Protected routes are guarded by the middleware
4. Authenticated routes require a valid session
5. User data is stored and retrieved based on authentication status

### Implementation
- NextAuth.js for authentication management
- Credentials provider for username/password authentication
- Session management with JWT tokens
- Protected routes via middleware in `src/middleware.ts`

## Data Management

### React Query
- Handles data fetching, caching, and state management
- Configured with stale times and garbage collection times
- Key-based cache management for optimal performance

### Custom Hooks
- `useTMDB`: Fetch movie and TV show data
- `useVidSrc`: Access streaming sources
- `useWatchHistory`: Manage user watch history

### State Persistence
- User watch history stored via API routes
- Development mode uses file-based storage
- Production design supports MongoDB

## Routing

### Next.js App Router
- File-based routing system
- Dynamic routes for content details
- API routes for server-side functionality

### Route Configuration
- Centralized route definitions in `src/lib/config.ts`
- Consistent URL structure for content types
- Nested routes for TV seasons and episodes

## Features

### Content Browsing
- Home page with featured content and content rows
- Category browsing for movies and TV shows
- Detailed pages for individual content items

### Search
- Real-time search with debounced input
- Combined results for movies and TV shows
- Deep linking to search results page

### User Features
- Watch history tracking with smart episode management
  - Automatically remembers the most recently watched episode for TV shows
  - Allows users to continue watching from where they left off
  - Intelligent linking to the latest episode from cards and continue watching section
- Profile management
- Authentication and authorization

### Video Playback
- Embedded video player
- Support for multiple streaming sources
- Season and episode navigation for TV shows

## Development Tools

### Scripts
- Data initialization and caching
- Database management
- Synchronization between TMDB and VidSrc

### Environment Configuration
- `.env` files for configuration
- Environment-specific settings
- API key management

### Testing
- Development mode features
- Test account for quick testing
- Logging and error handling

## Performance Considerations

### Caching Strategy
- React Query configured with appropriate stale times
- Next.js static and dynamic rendering
- Client-side caching for frequently accessed data

### Responsive Design
- Mobile-first approach
- Responsive UI components
- Optimized image loading

### Optimization
- Lazy loading of components and images
- Code splitting for better initial load time
- Debounced search to reduce API calls
- Optimistic updates for watch history to improve perceived performance
- Duplicate detection in API endpoints to prevent excessive database operations
- Reference tracking to prevent redundant state updates and API calls
- Throttled invalidation of queries to prevent refetch waterfalls

### Watch History Performance
- One-time watch history updates using reference tracking
- Deduplication of watch history entries in the API
- Optimistic updates in the React Query mutations
- Throttled refetching to prevent excessive API calls
- Time-based throttling to prevent duplicate entries within short time periods

## Security

### Authentication
- Secure password handling
- Session management
- Protected routes via middleware

### API Security
- Environment variable protection
- Server-side API request proxying
- Input validation and sanitization
