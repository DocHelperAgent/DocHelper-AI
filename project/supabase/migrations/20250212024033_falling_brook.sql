/*
  # Simplify Document Policies

  1. Changes
    - Drop all existing document policies
    - Create single unified read policy
    - Create simple write policies
    - Remove any potential for recursion
  
  2. Security
    - Maintain row-level security
    - Ensure proper access control
*/

-- First, drop all existing policies
DROP POLICY IF EXISTS "allow_select_own_documents" ON documents;
DROP POLICY IF EXISTS "allow_select_shared_documents" ON documents;
DROP POLICY IF EXISTS "allow_insert_own_documents" ON documents;
DROP POLICY IF EXISTS "allow_update_own_documents" ON documents;
DROP POLICY IF EXISTS "allow_delete_own_documents" ON documents;

-- Create a single unified read policy
CREATE POLICY "documents_read_policy"
  ON documents FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR
    id IN (
      SELECT document_id
      FROM document_shares
      WHERE shared_with = auth.uid()
    )
  );

-- Simple write policies
CREATE POLICY "documents_insert_policy"
  ON documents FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "documents_update_policy"
  ON documents FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "documents_delete_policy"
  ON documents FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());