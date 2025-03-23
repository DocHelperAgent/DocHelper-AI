/*
  # Fix document content constraints and indexing

  1. Changes
    - Drop existing constraints safely
    - Remove unique constraint on content
    - Add JSONB indexing for efficient document searching

  2. Notes
    - Ensures document content can be duplicated
    - Maintains data integrity
    - Improves search performance
*/

-- Drop constraints in the correct order
DO $$ 
BEGIN
  -- First, drop the foreign key constraint if it exists
  IF EXISTS (
    SELECT 1 
    FROM information_schema.table_constraints 
    WHERE constraint_name = 'documents_content_fkey'
  ) THEN
    ALTER TABLE documents DROP CONSTRAINT documents_content_fkey CASCADE;
  END IF;

  -- Then drop the unique constraint if it exists
  IF EXISTS (
    SELECT 1 
    FROM information_schema.table_constraints 
    WHERE constraint_name = 'documents_content_key'
  ) THEN
    ALTER TABLE documents DROP CONSTRAINT documents_content_key CASCADE;
  END IF;
END $$;

-- Create index for efficient content searching
CREATE INDEX IF NOT EXISTS documents_content_search_idx 
ON documents USING GIN ((content::jsonb));