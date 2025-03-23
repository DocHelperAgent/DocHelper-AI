/*
  # Fix document status handling

  1. Changes
    - Remove existing status constraints safely
    - Add check constraint for valid status values
    - Set default status value

  2. Security
    - Maintains existing RLS policies
*/

DO $$ 
BEGIN
  -- First, drop the foreign key constraint if it exists
  IF EXISTS (
    SELECT 1 
    FROM information_schema.table_constraints 
    WHERE constraint_name = 'documents_status_fkey'
  ) THEN
    ALTER TABLE documents DROP CONSTRAINT documents_status_fkey;
  END IF;

  -- Then drop the unique constraint if it exists
  IF EXISTS (
    SELECT 1 
    FROM information_schema.table_constraints 
    WHERE constraint_name = 'documents_status_key'
  ) THEN
    ALTER TABLE documents DROP CONSTRAINT documents_status_key;
  END IF;
END $$;

-- Add check constraint for valid status values
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.table_constraints 
    WHERE constraint_name = 'documents_status_check'
  ) THEN
    ALTER TABLE documents 
    ADD CONSTRAINT documents_status_check 
    CHECK (status IN ('draft', 'published', 'archived'));
  END IF;
END $$;

-- Set default value for status if not already set
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'documents' 
    AND column_name = 'status' 
    AND column_default = '''draft'''
  ) THEN
    ALTER TABLE documents 
    ALTER COLUMN status SET DEFAULT 'draft';
  END IF;
END $$;