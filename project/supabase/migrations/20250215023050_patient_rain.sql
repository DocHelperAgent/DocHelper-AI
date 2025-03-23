/*
  # Fix document versions schema and policies

  1. Changes
    - Add missing columns to document_versions table
    - Update RLS policies for better security
    - Add indexes for performance

  2. Security
    - Enable RLS on document_versions table
    - Add policies for document owners and shared users
    - Ensure proper cascading deletes
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can create versions of their documents" ON document_versions;
DROP POLICY IF EXISTS "Users can read versions of their documents" ON document_versions;

-- Ensure document_versions table has all required columns
DO $$ 
BEGIN
  -- Add source column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'document_versions' 
    AND column_name = 'source'
  ) THEN
    ALTER TABLE document_versions 
    ADD COLUMN source text DEFAULT 'database' NOT NULL;
  END IF;
END $$;

-- Create new policies with improved security
CREATE POLICY "allow_version_create_for_owners"
  ON document_versions FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM documents
      WHERE documents.id = document_id
      AND documents.user_id = auth.uid()
    )
  );

CREATE POLICY "allow_version_read_for_owners"
  ON document_versions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM documents
      WHERE documents.id = document_id
      AND documents.user_id = auth.uid()
    )
  );

CREATE POLICY "allow_version_read_for_shared_users"
  ON document_versions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM document_shares
      WHERE document_shares.document_id = document_id
      AND document_shares.shared_with = auth.uid()
    )
  );

-- Create or update indexes for better performance
DROP INDEX IF EXISTS idx_document_versions_document_id;
DROP INDEX IF EXISTS idx_document_versions_created_at;

CREATE INDEX idx_document_versions_document_id 
  ON document_versions(document_id);

CREATE INDEX idx_document_versions_created_at 
  ON document_versions(created_at DESC);

CREATE INDEX idx_document_versions_created_by 
  ON document_versions(created_by);

-- Add foreign key constraints if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'document_versions_document_id_fkey'
  ) THEN
    ALTER TABLE document_versions
    ADD CONSTRAINT document_versions_document_id_fkey
    FOREIGN KEY (document_id)
    REFERENCES documents(id)
    ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'document_versions_created_by_fkey'
  ) THEN
    ALTER TABLE document_versions
    ADD CONSTRAINT document_versions_created_by_fkey
    FOREIGN KEY (created_by)
    REFERENCES auth.users(id)
    ON DELETE CASCADE;
  END IF;
END $$;