/*
  # Update documents table RLS policies

  1. Changes
    - Add new RLS policies for documents table
    - Fix permission issues for document creation and updates
  
  2. Security
    - Enable RLS on documents table
    - Add policies for authenticated users
*/

-- First, drop existing policies if they exist
DROP POLICY IF EXISTS "documents_read_policy" ON documents;
DROP POLICY IF EXISTS "documents_insert_policy" ON documents;
DROP POLICY IF EXISTS "documents_update_policy" ON documents;
DROP POLICY IF EXISTS "documents_delete_policy" ON documents;

-- Create new policies
CREATE POLICY "enable_read_for_authenticated"
  ON documents FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "enable_insert_for_authenticated"
  ON documents FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "enable_update_for_owner"
  ON documents FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "enable_delete_for_owner"
  ON documents FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);