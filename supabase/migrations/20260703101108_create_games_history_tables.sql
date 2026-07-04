CREATE TABLE public.games (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_code TEXT,
  total_rounds INTEGER,
  status TEXT DEFAULT 'in_progress',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  finished_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS so only service_role backend can access
ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.game_players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID REFERENCES public.games(id) ON DELETE CASCADE NOT NULL,
  
  -- If it's a registered user, this will link to their profile
  profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL, 
  
  -- If they are anonymous/guest, we store their details here
  guest_name TEXT, 
  guest_avatar TEXT,
  
  score INTEGER DEFAULT 0 NOT NULL,
  placement INTEGER, -- 1st, 2nd, 3rd, etc.
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS so only service_role backend can access
ALTER TABLE public.game_players ENABLE ROW LEVEL SECURITY;


GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO service_role;

