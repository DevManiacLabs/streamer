# FreeFlix - Netflix-like Streaming Web Application

## Project Overview
FreeFlix is a robust, fast-loading web application that allows users to browse and stream movies and TV shows using the VidSrc API. The application features a modern UI/UX similar to Netflix, with robust search capabilities, user preferences, and a smooth streaming experience.

## Tech Stack

### Frontend
- **Framework**: Next.js (React) for server-side rendering and optimal performance
- **Styling**: Tailwind CSS for responsive design
- **State Management**: React Query for API data fetching and caching
- **UI Components**: Headless UI or Radix UI for accessible components

### Backend
- **API**: Next.js API routes for backend functionality
- **Database**: Supabase (PostgreSQL) for user data, favorites, and watch history
- **Authentication**: NextAuth.js for secure user authentication

## Scalability Considerations

### Performance Under Load
- **Static Generation**: Next.js pre-renders pages at build time, reducing server load
- **Incremental Static Regeneration**: Update static content without rebuilding the entire site
- **Edge Caching**: Utilize CDN caching for static assets and API responses
- **API Rate Limiting**: Implement rate limiting to prevent API abuse
- **Connection Pooling**: Optimize database connections for high concurrency
- **Serverless Functions**: Scale automatically with incoming traffic

### Database Optimization
- **Index Critical Columns**: Ensure proper indexing on frequently queried fields
- **Query Optimization**: Write efficient queries to minimize database load
- **Read Replicas**: Add read replicas for scaling read-heavy operations
- **Connection Pooling**: Manage database connections efficiently
- **Caching Layer**: Implement Redis for caching frequently accessed data

### Content Delivery
- **CDN Integration**: Use Content Delivery Networks for global distribution
- **Image Optimization**: Implement automatic image resizing and optimization
- **Lazy Loading**: Only load content as users scroll or navigate
- **Compression**: Enable Gzip/Brotli compression for all assets

## Key Features
1. **Home Page**: Featured content, trending movies, and personalized recommendations
2. **Browse Page**: Filter by genre, year, rating
3. **Search Functionality**: Instant search results
4. **Movie/TV Show Detail Pages**: Show synopsis, cast, related content
5. **Video Player**: Custom controls, quality selection, subtitle support
6. **User Profiles**: Watch history, favorites, preferences
7. **Responsive Design**: Works seamlessly on all devices

## Project Structure
```
free-flix/
├── public/                # Static assets
├── src/
│   ├── app/               # Next.js App Router pages
│   ├── components/        # Reusable UI components
│   │   ├── layout/        # Layout components
│   │   ├── ui/            # Core UI components
│   │   └── features/      # Feature-specific components
│   ├── lib/               # Utility functions and helpers
│   ├── api/               # API integration layer
│   └── hooks/             # Custom React hooks
├── tailwind.config.js     # Tailwind configuration
└── next.config.js         # Next.js configuration
```

## Development Roadmap

### Phase 1: Project Setup and Basic Structure
1. Initialize Next.js project with Tailwind CSS
2. Set up project structure
3. Create basic layout components
4. Implement API integration with VidSrc

### Phase 2: Core Functionality
1. Implement home page with movie listings
2. Create movie detail pages
3. Build basic video player
4. Set up pagination for movie lists

### Phase 3: Authentication and User Features
1. Implement user authentication
2. Add favorites functionality
3. Create watch history tracking
4. Add user preferences

### Phase 4: UI/UX Enhancements
1. Improve responsive design
2. Add animations and transitions
3. Implement dark/light mode
4. Optimize loading states and performance

### Phase 5: Advanced Features
1. Add search functionality with filters
2. Implement recommendations engine
3. Add subtitle support
4. Create custom video player controls

## API Integration

### VidSrc API Documentation

VidSrc provides comprehensive API endpoints for streaming movies and TV shows. The API allows embedding video content directly into our application.

#### Available Domains
Use any of these domains for embed URLs:
- vidsrc.in
- vidsrc.pm
- vidsrc.xyz
- vidsrc.net

#### Movie Endpoints

##### Get Movie Embed URL
**Endpoint:** `https://vidsrc.xyz/embed/movie`

**Valid Parameters:**
- `imdb` or `tmdb` (required) - IDs from imdb.com or themoviedb.com
- `sub_url` (optional) - URL encoded .srt or .vtt subtitle URL. Must have CORS enabled.
- `ds_lang` (optional) - Default subtitle language, ISO639 Language code.

**Examples:**
```
https://vidsrc.xyz/embed/movie/tt5433140
https://vidsrc.xyz/embed/movie?imdb=tt5433140
https://vidsrc.xyz/embed/movie?imdb=tt5433140&ds_lang=de
https://vidsrc.xyz/embed/movie?imdb=tt5433140&sub_url=https%3A%2F%2Fvidsrc.me%2Fsample.srt
https://vidsrc.xyz/embed/movie/385687
https://vidsrc.xyz/embed/movie?tmdb=385687
https://vidsrc.xyz/embed/movie?tmdb=385687&ds_lang=de
https://vidsrc.xyz/embed/movie?tmdb=385687&sub_url=https%3A%2F%2Fvidsrc.me%2Fsample.srt
```

#### TV Show Endpoints

##### Get TV Show Embed URL
**Endpoint:** `https://vidsrc.xyz/embed/tv`

**Valid Parameters:**
- `imdb` or `tmdb` (required) - IDs from imdb.com or themoviedb.com
- `ds_lang` (optional) - Default subtitle language, ISO639 Language code.

**Examples:**
```
https://vidsrc.xyz/embed/tv/tt0944947
https://vidsrc.xyz/embed/tv?imdb=tt0944947
https://vidsrc.xyz/embed/tv?imdb=tt0944947&ds_lang=de
https://vidsrc.xyz/embed/tv/1399
https://vidsrc.xyz/embed/tv?tmdb=1399&ds_lang=de
```

##### Get Episode Embed URL
**Endpoint:** `https://vidsrc.xyz/embed/tv`

**Valid Parameters:**
- `imdb` or `tmdb` (required) - IDs from imdb.com or themoviedb.com
- `season` (required) - The season number
- `episode` (required) - The episode number
- `sub_url` (optional) - URL encoded .srt or .vtt subtitle URL. Must have CORS enabled.
- `ds_lang` (optional) - Default subtitle language, ISO639 Language code.

**Examples:**
```
https://vidsrc.xyz/embed/tv/tt0944947/1-1
https://vidsrc.xyz/embed/tv?imdb=tt0944947&season=1&episode=1
https://vidsrc.xyz/embed/tv?imdb=tt0944947&season=1&episode=1&ds_lang=de
https://vidsrc.xyz/embed/tv?imdb=tt0944947&season=1&episode=1&sub_url=https%3A%2F%2Fvidsrc.me%2Fsample.srt
https://vidsrc.xyz/embed/tv/1399/1-1
https://vidsrc.xyz/embed/tv?tmdb=1399&season=1&episode=1
https://vidsrc.xyz/embed/tv?tmdb=1399&season=1&episode=1&ds_lang=de
https://vidsrc.xyz/embed/tv?tmdb=1399&season=1&episode=1&sub_url=https%3A%2F%2Fvidsrc.me%2Fsample.srt
```

#### Listing Endpoints

##### List Latest Movies
**Endpoint:** `https://vidsrc.xyz/movies/latest/page-{PAGE_NUMBER}.json`

**Parameters:**
- `PAGE_NUMBER` (required) - The page number for pagination

**Examples:**
```
https://vidsrc.xyz/movies/latest/page-1.json
https://vidsrc.xyz/movies/latest/page-15.json
```

##### List Latest TV Shows
**Endpoint:** `https://vidsrc.xyz/tvshows/latest/page-{PAGE_NUMBER}.json`

**Parameters:**
- `PAGE_NUMBER` (required) - The page number for pagination

**Examples:**
```
https://vidsrc.xyz/tvshows/latest/page-1.json
https://vidsrc.xyz/tvshows/latest/page-15.json
```

##### List Latest Episodes
**Endpoint:** `https://vidsrc.xyz/episodes/latest/page-{PAGE_NUMBER}.json`

**Parameters:**
- `PAGE_NUMBER` (required) - The page number for pagination

**Examples:**
```
https://vidsrc.xyz/episodes/latest/page-1.json
https://vidsrc.xyz/episodes/latest/page-25.json
```

## Performance Optimization Techniques
1. **Code Splitting**: Break down application into smaller chunks
2. **Tree Shaking**: Eliminate unused code
3. **Memoization**: Cache expensive function results
4. **Virtualized Lists**: Render only visible items in long lists
5. **Debouncing/Throttling**: Limit frequent function calls
6. **Web Workers**: Offload heavy computations to background threads
7. **Service Workers**: Enable offline functionality and cache assets

## Getting Started

### Prerequisites
- Node.js (v16+)
- npm or yarn

### Installation
1. Clone the repository
2. Install dependencies with `npm install` or `yarn install`
3. Create environment variables file `.env.local` with required credentials
4. Run the development server with `npm run dev` or `yarn dev`

## Testing Strategy
- **Unit Testing**: Test individual components with Jest and React Testing Library
- **Integration Testing**: Test component interactions
- **E2E Testing**: Verify full user flows with Cypress
- **Performance Testing**: Monitor Lighthouse scores and Web Vitals

## Deployment
- **Vercel**: Optimized for Next.js applications
- **Netlify**: Alternative deployment platform
- **Docker**: Containerized deployment for custom hosting

## Contributing
Guidelines for contributing to the project, code standards, and PR process.

## License
MIT License 