-- Restrict content_type to only 'link' and source_type to 'github'/'youtube'/'generic'
-- Part of the restrict-bookmark-types change: simplify type taxonomy

-- 1. Update non-conforming rows
UPDATE public.bookmarks
SET content_type = 'link'
WHERE content_type != 'link';

UPDATE public.bookmarks
SET source_type = 'generic'
WHERE source_type IS NOT NULL
  AND source_type NOT IN ('github', 'youtube', 'generic');

-- 2. Drop old CHECK constraints and add new tight ones

-- content_type: drop old, add new
ALTER TABLE public.bookmarks
  DROP CONSTRAINT IF EXISTS bookmarks_content_type_check;

ALTER TABLE public.bookmarks
  ADD CONSTRAINT bookmarks_content_type_check
  CHECK (content_type IN ('link'));

-- source_type: drop old, add new
ALTER TABLE public.bookmarks
  DROP CONSTRAINT IF EXISTS bookmarks_source_type_check;

ALTER TABLE public.bookmarks
  ADD CONSTRAINT bookmarks_source_type_check
  CHECK (source_type IS NULL OR source_type IN ('github', 'youtube', 'generic'));
