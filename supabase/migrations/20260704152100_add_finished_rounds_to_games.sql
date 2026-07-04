-- Migration: Add finished_rounds to games table
-- Description: Adds a finished_rounds column to track exactly how many rounds completed before abandonment.

ALTER TABLE public.games 
ADD COLUMN IF NOT EXISTS finished_rounds INTEGER DEFAULT 0;
