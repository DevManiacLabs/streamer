# Streamer TMDB to VidSrc Synchronization

This directory contains scripts to synchronize TMDB (The Movie Database) content with VidSrc availability and store the results in MongoDB.

## Overview

The synchronization process involves three main scripts:

1. **Movie Sync** (`tmdb-vidsrc-sync.ts`): Syncs movies from TMDB with VidSrc availability
2. **TV Show Sync** (`tmdb-vidsrc-tv-sync.ts`): Syncs TV shows from TMDB with VidSrc availability
3. **TV Episode Sync** (`tmdb-vidsrc-tv-episodes-sync.ts`): Syncs TV show episodes from TMDB with VidSrc availability

All scripts store their data in a MongoDB database in the `content` collection, using the same data format to ensure compatibility with the frontend.

## MongoDB Data Format

The data is stored in MongoDB with the following format:

```typescript
interface ContentDocument {
  tmdbId: number;       // TMDB ID of the content
  type: 'movie' | 'tvshow';  // Type of content
  data: Movie | TVShow;  // Full TMDB data object
  seasons?: {          // TV show seasons (only for TV shows)
    seasonNumber: number;
    episodeCount: number;
    available: boolean;
    lastChecked: Date;
    episodes?: {        // TV show episodes (only for TV shows)
      episodeNumber: number;
      available: boolean;
      lastChecked: Date;
    }[];
  }[];
  available: boolean;   // Whether the content is available on VidSrc
  lastChecked: Date;    // When the content was last checked
}
```

## Prerequisites

- Node.js 18+
- MongoDB instance (set up connection string in `.env`)
- TMDB API key (set in `.env`)

## Environment Variables

Create a `.env` file in the project root with the following:

```
MONGODB_URI=your_mongodb_connection_string
TMDB_API_KEY=your_tmdb_api_key
```

## Running the Scripts

### Movie Sync

```bash
# Basic usage
npm run sync-movies

# With options
npx ts-node --project tsconfig.scripts.json scripts/tmdb-vidsrc-sync.ts --start-page 1 --concurrency 10
```

Options:
- `--start-page`: The TMDB page to start from (default: 1)
- `--dry-run`: Don't actually update the database, just log what would happen
- `--concurrency`: Number of concurrent requests to make (default: 10)

### TV Show Sync

```bash
# Basic usage
npm run sync-tv

# With options
npx ts-node --project tsconfig.scripts.json scripts/tmdb-vidsrc-tv-sync.ts --start-page 1 --concurrency 10
```

Options:
- Same as Movie Sync

### TV Episode Sync

```bash
# Basic usage
npm run sync-episodes

# With options
npx ts-node --project tsconfig.scripts.json scripts/tmdb-vidsrc-tv-episodes-sync.ts --limit 20 --concurrency 5
```

Options:
- `--limit`: Number of TV shows to process (default: 10)
- `--dry-run`: Don't actually update the database, just log what would happen
- `--concurrency`: Number of concurrent episode requests (default: 5)

### Run All Syncs

To run all synchronization scripts in sequence:

```bash
npm run sync-all
```

## Logging

All scripts log their activity to the `logs` directory with timestamped filenames. Check these logs for debugging and monitoring sync progress.

## Resumability

If a script is interrupted, it will save its progress to a JSON file (`progress.json`, `tv-progress.json`, or `tv-episodes-progress.json`) and can resume from where it left off when restarted.

## Troubleshooting

- **Rate Limiting**: The scripts include fallback mechanisms with proxies when rate limited
- **Connection Issues**: Check the logs for connection errors and verify your MongoDB URI
- **Availability Issues**: If VidSrc domains are not responding, check the console logs and try updating the domain list in the script 