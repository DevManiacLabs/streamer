# TMDB to VidSrc Movie Sync Script

This script syncs movies from TMDB API to the database and checks their availability on VidSrc.

## Prerequisites

- Node.js (v16+)
- npm or yarn
- MongoDB cluster
- TMDB API key

## Environment Variables

Create a `.env` file with the following:

```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/dbname
NEXT_PUBLIC_TMDB_API_KEY=your_tmdb_api_key
```

## Installation

```bash
cd streamer/scripts
npm install
```

## Usage

### Basic Run

```bash
npm run start
```

### Dry Run (without modifying database)

```bash
npm run start:dry
```

### Resume from a Specific Page

```bash
npm run start -- --start-page 5
```

### Control Concurrency

```bash
npm run start -- --concurrency 5
```

### Custom Options

```bash
npm run start -- --start-page 10 --concurrency 5 --dry-run
```

### Check Sync Status

To check the current status of the movie sync in the database:

```bash
npm run check
```

This will display:
- Total number of documents in the database
- Number of available and unavailable movies
- Percentage of available movies
- 5 most recently synced movies

## Command Line Options

- `--start-page <number>`: Start processing from a specific page (default: 1)
- `--dry-run`: Run without modifying the database
- `--concurrency <number>`: Number of concurrent requests (default: 10)

## Progress and Resumability

The script saves progress to `progress.json` and can be resumed from where it left off if interrupted.

## Logs

Logs are stored in the `logs` directory with timestamps.

## Troubleshooting

- If you encounter rate limits, try decreasing the concurrency
- Make sure your MongoDB connection string is correct
- Check logs for detailed error information