# TMDB to VidSrc Movie Sync Script — Plan

## Implementation Checklist

- [x] 1. Set up environment variables and MongoDB connection
- [x] 2. Implement logging (file and console)
- [x] 3. Fetch total number of TMDB movie pages
- [x] 4. Implement resumability (progress tracking in DB or file)
- [x] 5. Fetch movies from TMDB page by page
- [x] 6. For each movie, check if already processed in DB
- [x] 7. For unprocessed movies, check VidSrc availability
- [x] 8. Upsert movie record in MongoDB with all relevant data and status
- [x] 9. Implement concurrency and rate limiting for API requests
- [x] 10. Implement retry logic and error handling
- [x] 11. Log progress and errors
- [x] 12. Add command-line arguments for start page/index, batch size, and dry run
- [x] 13. Create package.json, tsconfig.json, and README to document script usage
- [x] 14. Create a database check script to monitor sync status
- [ ] 15. (Optional) Add support for worker threads for higher throughput
- [ ] 16. (Optional) Add support for TV shows

---

## Next Steps

1. Install the script dependencies by running `npm install` in the scripts directory
2. Test the script with a dry run: `npm run start:dry`
3. Run the full sync: `npm run start`
4. Monitor progress with the check script: `npm run check`

---

## 1. Requirements & Constraints
- **Data Sources:**  
  - TMDB API (all movies): [TMDB API Reference](https://developer.themoviedb.org/reference)
  - VidSrc API (streaming availability): [VidSrc API Reference](https://vidsrc.me/api/)
- **Database:**  
  - MongoDB (cluster provided)
- **Performance:**  
  - Fast, concurrent requests (rate-limited to avoid bans)
- **Resumability:**  
  - Must resume from last processed movie if interrupted (crash, pause, etc.)
- **Robustness:**  
  - Handles API errors, retries, and logs progress

---

## 2. High-Level Steps

### A. Initialization
- Load environment variables (API keys, MongoDB URI)
- Connect to MongoDB
- Set up logging (to file and console)

### B. Fetching Movies from TMDB
- Use `/discover/movie` endpoint to fetch all movies (paginated, up to 20,000+ pages)
- For each movie, get its TMDB ID and relevant metadata

### C. Resumability
- For each movie, store a status in MongoDB:
  - Not checked
  - Checked & available
  - Checked & unavailable
- On startup, query MongoDB for the last processed page/movie and continue from there

### D. Checking VidSrc Availability
- For each TMDB movie, check VidSrc availability using:
  - `https://vidsrc.xyz/embed/movie/{tmdb_id}`
- Use concurrent requests (with a limit, e.g., 10-20 at a time)
- Implement retry logic for failed requests

### E. Database Update
- For each movie, upsert (insert or update) the record in MongoDB with:
  - TMDB ID
  - Metadata (title, year, etc.)
  - VidSrc availability status
  - Last checked timestamp

### F. Logging & Monitoring
- Log progress (current page, total processed, errors)
- Write progress to a file or DB for resumability

---

## 3. Detailed Design

### 1. MongoDB Schema
```js
{
  tmdbId: Number,
  title: String,
  year: Number,
  vidsrcAvailable: Boolean,
  lastChecked: Date,
  tmdbData: Object,
  // ...other metadata
}
```

### 2. Concurrency & Rate Limiting
- Use a queue or pool for concurrent HTTP requests (e.g., with `Promise.allSettled`)
- Respect TMDB and VidSrc rate limits (TMDB: 40 requests/10s, VidSrc: unknown, so be conservative)

### 3. Resumability
- Store the last processed TMDB page and movie index in a progress collection or a local file
- On restart, read this progress and continue

### 4. Error Handling
- Retry failed requests (with exponential backoff)
- Log errors and skip after N retries

### 5. Script Entrypoint
- Accept command-line arguments for:
  - Start page/index (optional)
  - Batch size/concurrency
  - Dry run mode

---

## 4. Pseudocode Outline

```js
// Initialization
loadEnv();
connectToMongo();
loadProgress();

// Main Loop
for (page = lastPage; page <= totalPages; page++) {
  movies = fetchTMDBMovies(page);
  for (movie of movies) {
    if (alreadyChecked(movie.tmdbId)) continue;
    available = checkVidSrc(movie.tmdbId);
    upsertMovieInDB(movie, available);
    updateProgress(page, movieIndex);
  }
}
```

---

## 5. Extra Features (Optional)
- Use worker threads or child processes for even faster processing
- Add a web dashboard for monitoring progress
- Support for TV shows (future extension)

---

## 6. References
- [TMDB API Reference](https://developer.themoviedb.org/reference)
- [VidSrc API Reference](https://vidsrc.me/api/) 