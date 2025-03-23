/*
  # Final Document Policies Fix

  1. Changes
    - Drop all existing document policies
    - Create new non-recursive policies
    - Simplify policy structure
  
  2. Security
    - Maintain row-level security
    - Ensure proper document access control
*/

-- Drop all existing policies
DROP POLICY IF EXISTS "documents_select_policy" ON documents;
DROP POLICY IF EXISTS "documents_insert_policy" ON documents;
DROP POLICY IF EXISTS "documents_update_policy" ON documents;
DROP POLICY IF EXISTS "documents_delete_policy" ON documents;

-- Create new simplified policies
CREATE POLICY "allow_select_own_documents"
  ON documents FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "allow_select_shared_documents"
  ON documents FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM document_shares
      WHERE document_shares.document_id = id
      AND document_shares.shared_with = auth.uid()
    )
  );

CREATE POLICY "allow_insert_own_documents"
  ON documents FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "allow_update_own_documents"
  ON documents FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "allow_delete_own_documents"
  ON documents FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());