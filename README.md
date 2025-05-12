# FreeFlix - Netflix-like Streaming Platform

FreeFlix is a robust, modern streaming platform that allows users to browse and stream movies and TV shows using the VidSrc API. It features a responsive UI, authentication, search capabilities, and a personalized watch history.

## 🚀 Features

- **Content Browsing**: Browse movies and TV shows from various categories
- **Video Streaming**: Stream content directly within the app
- **User Authentication**: Sign up, login, and maintain persistent sessions
- **Search**: Search for movies and TV shows
- **Responsive Design**: Optimized for mobile, tablet, and desktop
- **Watch History**: Track your watched content for a personalized experience

## 📂 Project Structure

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
├── next.config.js         # Next.js configuration
└── tailwind.config.js     # Tailwind CSS configuration
```

## 🛠️ Technology Stack

- **Frontend**:
  - Next.js (React)
  - TypeScript
  - Tailwind CSS
  - React Query for data fetching

- **Backend**:
  - Next.js API Routes
  - NextAuth.js for authentication
  - Supabase/MongoDB for data persistence (configurable)

- **APIs**:
  - TMDB API for movie/TV metadata
  - VidSrc API for streaming content

## 🚦 Getting Started

### Prerequisites
- Node.js (v16+)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/free-flix.git
cd free-flix
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Set up environment variables:
Create a `.env.local` file in the root directory with the following variables:
```
NEXT_PUBLIC_TMDB_API_KEY=your_tmdb_api_key
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=http://localhost:3000
```

4. Start the development server:
```bash
npm run dev
# or
yarn dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🧪 Development Workflow

### API Data Flow
1. Data is fetched from external APIs (TMDB, VidSrc) using React Query hooks
2. Response data is properly typed and transformed for consumption by components
3. Components display data and handle user interactions

### Authentication Flow
1. Users register or sign in through the login page
2. NextAuth.js handles authentication state and session management
3. Protected routes are guarded by middleware
4. User preferences and history are persisted to the database

### Adding New Features
1. Create any necessary types in `/src/types/`
2. Implement API integration in `/src/api/` if needed
3. Create React Query hooks in `/src/hooks/` for data fetching
4. Build UI components in `/src/components/`
5. Implement pages in `/src/app/`

## 📄 License

This project is licensed under the MIT License. See the LICENSE file for details.

## 🙏 Acknowledgements

- [The Movie Database (TMDB)](https://www.themoviedb.org/) for providing movie and TV show metadata
- [VidSrc](https://vidsrc.xyz) for the streaming API
- [Next.js](https://nextjs.org/) and [Vercel](https://vercel.com/) for the amazing framework
- [TailwindCSS](https://tailwindcss.com/) for the utility-first CSS framework
