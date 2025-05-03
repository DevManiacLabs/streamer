-- Initialize the users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table for storing user watch history
CREATE TABLE IF NOT EXISTS watch_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content_type TEXT NOT NULL, -- 'movie' or 'tvshow'
  content_id TEXT NOT NULL, -- TMDB ID
  episode_number INTEGER, -- NULL for movies
  season_number INTEGER, -- NULL for movies
  watched_time INTEGER NOT NULL DEFAULT 0, -- Time in seconds
  total_duration INTEGER, -- Total duration in seconds
  last_watched TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, content_type, content_id, season_number, episode_number)
);

-- Table for user favorites
CREATE TABLE IF NOT EXISTS favorites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content_type TEXT NOT NULL, -- 'movie' or 'tvshow'
  content_id TEXT NOT NULL, -- TMDB ID
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, content_type, content_id)
);

-- Function to securely check passwords
CREATE OR REPLACE FUNCTION verify_password(input_email TEXT, input_password TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  stored_password_hash TEXT;
BEGIN
  -- Get the stored password hash for the user
  SELECT password_hash INTO stored_password_hash
  FROM users
  WHERE email = input_email;
  
  -- If no user with that email, return false
  IF stored_password_hash IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Check if the password matches using Supabase's pgcrypto extension
  RETURN stored_password_hash = crypt(input_password, stored_password_hash);
  
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add RLS policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE watch_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

-- Users table policies
CREATE POLICY users_select_own ON users FOR SELECT 
  USING (auth.uid() = id);

-- Watch history policies
CREATE POLICY watch_history_select_own ON watch_history FOR SELECT 
  USING (auth.uid() = user_id);
  
CREATE POLICY watch_history_insert_own ON watch_history FOR INSERT 
  WITH CHECK (auth.uid() = user_id);
  
CREATE POLICY watch_history_update_own ON watch_history FOR UPDATE 
  USING (auth.uid() = user_id);
  
CREATE POLICY watch_history_delete_own ON watch_history FOR DELETE 
  USING (auth.uid() = user_id);

-- Favorites policies
CREATE POLICY favorites_select_own ON favorites FOR SELECT 
  USING (auth.uid() = user_id);
  
CREATE POLICY favorites_insert_own ON favorites FOR INSERT 
  WITH CHECK (auth.uid() = user_id);
  
CREATE POLICY favorites_delete_own ON favorites FOR DELETE 
  USING (auth.uid() = user_id); 