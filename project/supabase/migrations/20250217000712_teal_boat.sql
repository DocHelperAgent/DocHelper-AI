/*
  # Fix document constraints and indexes

  1. Changes
    - Safely remove and recreate constraints with proper dependencies
    - Add composite index for user_id and title
    - Update trigger for updated_at maintenance
    
  2. Security
    - Maintain existing RLS policies
*/

-- Drop constraints in the correct order
DO $$ 
BEGIN
  -- First drop the foreign key that depends on the unique constraint
  IF EXISTS (
    SELECT 1 
    FROM information_schema.table_constraints 
    WHERE constraint_name = 'documents_user_id_fkey1'
  ) THEN
    ALTER TABLE documents DROP CONSTRAINT documents_user_id_fkey1;
  END IF;

  -- Then drop the unique constraint
  IF EXISTS (
    SELECT 1 
    FROM information_schema.table_constraints 
    WHERE constraint_name = 'documents_user_id_key'
  ) THEN
    ALTER TABLE documents DROP CONSTRAINT documents_user_id_key;
  END IF;
END $$;

-- Ensure proper foreign key constraint exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.table_constraints 
    WHERE constraint_name = 'documents_user_id_fkey'
  ) THEN
    ALTER TABLE documents
    ADD CONSTRAINT documents_user_id_fkey
    FOREIGN KEY (user_id)
    REFERENCES auth.users(id)
    ON DELETE CASCADE;
  END IF;
END $$;

-- Create an index for better query performance
CREATE INDEX IF NOT EXISTS idx_documents_user_id_title 
ON documents(user_id, title);

-- Ensure updated_at is properly maintained
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Recreate the trigger if it doesn't exist
DROP TRIGGER IF EXISTS update_documents_updated_at ON documents;
CREATE TRIGGER update_documents_updated_at
  BEFORE UPDATE ON documents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();