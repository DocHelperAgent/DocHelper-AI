/*
  # Document Sharing Permissions Update

  1. Changes
    - Add role_type column to document_shares table
    - Update document sharing policies to handle editor and viewer roles
    - Add policies for editors to modify documents
    - Add policies for viewers to only read documents

  2. Security
    - Enable RLS for all tables
    - Add granular policies for different permission levels
    - Ensure data isolation between users
*/

-- Add role_type to document_shares if it doesn't exist
DO $$ 
BEGIN 
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'document_shares' 
    AND column_name = 'role_type'
  ) THEN
    ALTER TABLE document_shares ADD COLUMN role_type text NOT NULL DEFAULT 'viewer';
  END IF;
END $$;

-- Drop existing document sharing policies
DROP POLICY IF EXISTS "documents_read_policy" ON documents;
DROP POLICY IF EXISTS "documents_insert_policy" ON documents;
DROP POLICY IF EXISTS "documents_update_policy" ON documents;
DROP POLICY IF EXISTS "documents_delete_policy" ON documents;

-- Create new document policies
CREATE POLICY "allow_document_owner_full_access"
  ON documents FOR ALL
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "allow_editors_read_write"
  ON documents FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM document_shares
      WHERE document_shares.document_id = id
      AND document_shares.shared_with = auth.uid()
      AND document_shares.role_type = 'editor'
    )
  );

CREATE POLICY "allow_editors_update"
  ON documents FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM document_shares
      WHERE document_shares.document_id = id
      AND document_shares.shared_with = auth.uid()
      AND document_shares.role_type = 'editor'
    )
  );

CREATE POLICY "allow_viewers_read_only"
  ON documents FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM document_shares
      WHERE document_shares.document_id = id
      AND document_shares.shared_with = auth.uid()
      AND document_shares.role_type = 'viewer'
    )
  );

-- Update document_shares policies
DROP POLICY IF EXISTS "Users can manage their document shares" ON document_shares;
DROP POLICY IF EXISTS "Users can view shares they're part of" ON document_shares;

CREATE POLICY "allow_owner_manage_shares"
  ON document_shares FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM documents
      WHERE documents.id = document_shares.document_id
      AND documents.user_id = auth.uid()
    )
  );

CREATE POLICY "allow_users_view_their_shares"
  ON document_shares FOR SELECT
  TO authenticated
  USING (shared_with = auth.uid());