/*
  # Fix Documents RLS Policies

  1. Changes
    - Drop existing RLS policies for documents table
    - Create new simplified RLS policies that allow:
      - Authenticated users to create documents
      - Document owners to read/update/delete their documents
      - Shared users to read documents shared with them

  2. Security
    - Maintains strict RLS enforcement
    - Ensures users can only access their own documents
    - Preserves document sharing functionality
*/

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "enable_read_for_authenticated" ON documents;
DROP POLICY IF EXISTS "enable_insert_for_authenticated" ON documents;
DROP POLICY IF EXISTS "enable_update_for_owner" ON documents;
DROP POLICY IF EXISTS "enable_delete_for_owner" ON documents;

-- Create new policies
CREATE POLICY "documents_select_policy"
  ON documents FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM document_shares
      WHERE document_shares.document_id = id
      AND document_shares.shared_with = auth.uid()
    )
  );

CREATE POLICY "documents_insert_policy"
  ON documents FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "documents_update_policy"
  ON documents FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "documents_delete_policy"
  ON documents FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());