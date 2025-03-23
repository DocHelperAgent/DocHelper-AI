/*
  # Add document timestamps

  1. Changes
    - Add created_at and updated_at columns to documents table
    - Set default values using now()
    - Update existing rows with current timestamp
    - Ensure trigger for updated_at is in place

  2. Notes
    - Maintains data consistency
    - Enables proper timestamp tracking
    - Preserves existing data
*/

-- Add timestamp columns if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'documents' 
    AND column_name = 'created_at'
  ) THEN
    ALTER TABLE documents 
    ADD COLUMN created_at timestamptz DEFAULT now();
  END IF;

  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'documents' 
    AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE documents 
    ADD COLUMN updated_at timestamptz DEFAULT now();
  END IF;
END $$;

-- Update any NULL timestamps to current time
UPDATE documents 
SET 
  created_at = now() 
WHERE created_at IS NULL;

UPDATE documents 
SET 
  updated_at = now() 
WHERE updated_at IS NULL;

-- Make timestamps NOT NULL
ALTER TABLE documents 
ALTER COLUMN created_at SET NOT NULL,
ALTER COLUMN updated_at SET NOT NULL;

-- Ensure the update_updated_at_column function exists
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create or replace the trigger
DROP TRIGGER IF EXISTS update_documents_updated_at ON documents;

CREATE TRIGGER update_documents_updated_at
  BEFORE UPDATE
  ON documents
  FOR EACH ROW
  EXECUTE PROCEDURE update_updated_at_column();