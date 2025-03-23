/*
  # Fix Documents RLS Policies

  1. Changes
    - Drop existing policies on documents table
    - Create new, simplified policies for documents table
    - Ensure no circular references in policies
  
  2. Security
    - Maintain row-level security
    - Users can only access their own documents
    - Users can read documents shared with them
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can CRUD own documents" ON documents;
DROP POLICY IF EXISTS "Users can read shared documents" ON documents;

-- Create new policies
CREATE POLICY "Enable read for users own documents"
  ON documents FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Enable insert for authenticated users"
  ON documents FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Enable update for users own documents"
  ON documents FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Enable delete for users own documents"
  ON documents FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Enable read for shared documents"
  ON documents FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 
      FROM document_shares 
      WHERE document_shares.document_id = documents.id 
      AND document_shares.shared_with = auth.uid()
    )
  );