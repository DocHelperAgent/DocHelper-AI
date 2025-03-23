/*
  # Add comments functionality

  1. New Tables
    - `document_comments`
      - `id` (uuid, primary key)
      - `document_id` (uuid, references documents)
      - `user_id` (uuid, references users)
      - `content` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `document_comments` table
    - Add policies for document owners and shared users
*/

-- Create comments table
CREATE TABLE document_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid REFERENCES documents(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  content text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE document_comments ENABLE ROW LEVEL SECURITY;

-- Create updated_at trigger
CREATE TRIGGER update_document_comments_updated_at
  BEFORE UPDATE ON document_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Comments policies
CREATE POLICY "allow_comment_create"
  ON document_comments FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM documents
      WHERE documents.id = document_id
      AND (
        documents.user_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM document_shares
          WHERE document_shares.document_id = documents.id
          AND document_shares.shared_with = auth.uid()
        )
      )
    )
  );

CREATE POLICY "allow_comment_read"
  ON document_comments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM documents
      WHERE documents.id = document_id
      AND (
        documents.user_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM document_shares
          WHERE document_shares.document_id = documents.id
          AND document_shares.shared_with = auth.uid()
        )
      )
    )
  );

CREATE POLICY "allow_comment_update"
  ON document_comments FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "allow_comment_delete"
  ON document_comments FOR DELETE
  TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM documents
      WHERE documents.id = document_id
      AND documents.user_id = auth.uid()
    )
  );