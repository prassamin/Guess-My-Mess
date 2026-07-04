-- Add username column
ALTER TABLE public.profiles ADD COLUMN username TEXT UNIQUE;

-- Function to handle new user signups with unique username generation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  base_username TEXT;
  new_username TEXT;
  counter INTEGER := 0;
BEGIN
  -- Convert full_name to lowercase, remove non-alphanumeric chars
  base_username := lower(regexp_replace(NEW.raw_user_meta_data->>'full_name', '[^a-zA-Z0-9]', '', 'g'));
  
  -- Fallback if name is empty or null
  IF base_username IS NULL OR base_username = '' THEN
    base_username := 'player';
  END IF;

  new_username := base_username;
  
  -- Loop to check for uniqueness
  WHILE EXISTS (SELECT 1 FROM public.profiles WHERE username = new_username) LOOP
    counter := counter + 1;
    new_username := base_username || counter;
  END LOOP;

  INSERT INTO public.profiles (id, name, avatar, username)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url',
    new_username
  );
  RETURN NEW;
END;
$$;

-- Update existing profiles that don't have a username (fallback)
DO $$ 
DECLARE 
  r RECORD;
  base_username TEXT;
  new_username TEXT;
  counter INTEGER;
BEGIN
  FOR r IN SELECT id, name FROM public.profiles WHERE username IS NULL LOOP
    base_username := lower(regexp_replace(r.name, '[^a-zA-Z0-9]', '', 'g'));
    IF base_username IS NULL OR base_username = '' THEN
      base_username := 'player';
    END IF;
    
    new_username := base_username;
    counter := 0;
    
    WHILE EXISTS (SELECT 1 FROM public.profiles WHERE username = new_username) LOOP
      counter := counter + 1;
      new_username := base_username || counter;
    END LOOP;
    
    UPDATE public.profiles SET username = new_username WHERE id = r.id;
  END LOOP;
END $$;
