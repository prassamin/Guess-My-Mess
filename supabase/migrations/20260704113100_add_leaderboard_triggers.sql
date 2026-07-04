-- Migration: Add total_score, games_played, total_wins to profiles and set up triggers
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS total_score INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS games_played INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_wins INTEGER DEFAULT 0;

-- Create an index on total_score for rapid leaderboard queries
CREATE INDEX IF NOT EXISTS idx_profiles_total_score ON public.profiles(total_score DESC);

-- The trigger function to handle game_players changes
CREATE OR REPLACE FUNCTION public.update_profile_stats_on_game()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  score_diff INTEGER := 0;
  games_diff INTEGER := 0;
  wins_diff INTEGER := 0;
BEGIN
  -- We only care about authenticated users (profile_id is not null)
  IF (TG_OP = 'INSERT') THEN
    IF NEW.profile_id IS NOT NULL THEN
      score_diff := NEW.score;
      games_diff := 1;
      IF NEW.placement = 1 THEN
        wins_diff := 1;
      END IF;
      
      UPDATE public.profiles 
      SET total_score = total_score + score_diff,
          games_played = games_played + games_diff,
          total_wins = total_wins + wins_diff
      WHERE id = NEW.profile_id;
    END IF;
  ELSIF (TG_OP = 'UPDATE') THEN
    IF NEW.profile_id IS NOT NULL THEN
      score_diff := NEW.score - OLD.score;
      
      -- Check if they just got awarded 1st place
      IF (NEW.placement = 1 AND (OLD.placement IS NULL OR OLD.placement != 1)) THEN
        wins_diff := 1;
      -- Check if they were stripped of 1st place
      ELSIF (OLD.placement = 1 AND (NEW.placement IS NULL OR NEW.placement != 1)) THEN
        wins_diff := -1;
      END IF;

      IF score_diff != 0 OR wins_diff != 0 THEN
        UPDATE public.profiles 
        SET total_score = total_score + score_diff,
            total_wins = total_wins + wins_diff
        WHERE id = NEW.profile_id;
      END IF;
    END IF;
  ELSIF (TG_OP = 'DELETE') THEN
    IF OLD.profile_id IS NOT NULL THEN
      score_diff := -OLD.score;
      games_diff := -1;
      IF OLD.placement = 1 THEN
        wins_diff := -1;
      END IF;

      UPDATE public.profiles 
      SET total_score = total_score + score_diff,
          games_played = games_played + games_diff,
          total_wins = total_wins + wins_diff
      WHERE id = OLD.profile_id;
    END IF;
  END IF;

  IF (TG_OP = 'DELETE') THEN
    RETURN OLD;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Drop trigger if it already exists
DROP TRIGGER IF EXISTS on_game_player_change ON public.game_players;

-- Attach the trigger to game_players
CREATE TRIGGER on_game_player_change
  AFTER INSERT OR UPDATE OR DELETE ON public.game_players
  FOR EACH ROW EXECUTE FUNCTION public.update_profile_stats_on_game();

-- Backfill existing data so that players with history instantly get their scores updated!
WITH player_stats AS (
  SELECT profile_id, 
         SUM(score) as sum_score, 
         COUNT(*) as count_games, 
         SUM(CASE WHEN placement = 1 THEN 1 ELSE 0 END) as sum_wins
  FROM public.game_players
  WHERE profile_id IS NOT NULL
  GROUP BY profile_id
)
UPDATE public.profiles p
SET total_score = COALESCE(ps.sum_score, 0),
    games_played = COALESCE(ps.count_games, 0),
    total_wins = COALESCE(ps.sum_wins, 0)
FROM player_stats ps
WHERE p.id = ps.profile_id;
