/*
  # Fix Document Policies

  1. Changes
    - Drop all existing document policies
    - Create new simplified policies without recursive checks
    - Add proper RLS policies for documents table
  
  2. Security
    - Maintain row-level security
    - Ensure users can only access their own documents
    - Allow shared document access without recursion
*/

-- First, drop all existing policies on the documents table
DROP POLICY IF EXISTS "Enable read for users own documents" ON documents;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON documents;
DROP POLICY IF EXISTS "Enable update for users own documents" ON documents;
DROP POLICY IF EXISTS "Enable delete for users own documents" ON documents;
DROP POLICY IF EXISTS "Enable read for shared documents" ON documents;

-- Create new simplified policies
CREATE POLICY "documents_select_policy" 
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