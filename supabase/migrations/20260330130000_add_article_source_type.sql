-- Add 'article' to the source_type CHECK constraint
-- Part of the OG type parsing feature: detect article pages from OG metadata

ALTER TABLE public.bookmarks
  DROP CONSTRAINT IF EXISTS bookmarks_source_type_check;

ALTER TABLE public.bookmarks
  ADD CONSTRAINT bookmarks_source_type_check
  CHECK (source_type IS NULL OR source_type IN ('github', 'youtube', 'article', 'generic'));
