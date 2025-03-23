/*
  # Add document versioning

  1. New Tables
    - `document_versions`
      - `id` (uuid, primary key)
      - `document_id` (uuid, references documents)
      - `content` (jsonb, stores document content)
      - `title` (text, document title at time of version)
      - `created_at` (timestamp)
      - `created_by` (uuid, references users)

  2. Security
    - Enable RLS on `document_versions` table
    - Add policies for document owners and editors
*/

-- Create versions table
CREATE TABLE document_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid REFERENCES documents(id) ON DELETE CASCADE NOT NULL,
  content jsonb NOT NULL,
  title text NOT NULL,
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL
);

-- Enable RLS
ALTER TABLE document_versions ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "allow_version_create"
  ON document_versions FOR INSERT
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
          AND document_shares.role_type = 'editor'
        )
      )
    )
  );

CREATE POLICY "allow_version_read"
  ON document_versions FOR SELECT
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