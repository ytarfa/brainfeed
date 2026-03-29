-- Add "unsupported" to the enrichment_status CHECK constraint.
-- This value marks content types the enrichment pipeline cannot process
-- (e.g. raw files, images) as distinct from actual processing failures.

ALTER TABLE bookmarks
  DROP CONSTRAINT IF EXISTS bookmarks_enrichment_status_check;

ALTER TABLE bookmarks
  ADD CONSTRAINT bookmarks_enrichment_status_check
  CHECK (enrichment_status IN ('pending', 'processing', 'completed', 'failed', 'unsupported'));
