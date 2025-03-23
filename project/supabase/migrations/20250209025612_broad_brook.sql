/*
  # Initial Schema Setup for DocHelper AI

  1. New Tables
    - users
      - id (uuid, primary key)
      - email (text)
      - full_name (text)
      - avatar_url (text)
      - created_at (timestamp)
      
    - documents
      - id (uuid, primary key)
      - title (text)
      - content (jsonb)
      - user_id (uuid, foreign key)
      - template_id (uuid, foreign key)
      - status (text)
      - created_at (timestamp)
      - updated_at (timestamp)
      
    - templates
      - id (uuid, primary key)
      - name (text)
      - description (text)
      - content (jsonb)
      - category (text)
      - created_at (timestamp)
      
    - document_shares
      - id (uuid, primary key)
      - document_id (uuid, foreign key)
      - shared_with (uuid, foreign key)
      - permission_level (text)
      - created_at (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for user data access
    - Add policies for document sharing
*/

-- Create users table
CREATE TABLE users (
  id uuid REFERENCES auth.users PRIMARY KEY,
  email text,
  full_name text,
  avatar_url text,
  created_at timestamptz DEFAULT now()
);

-- Create templates table
CREATE TABLE templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  content jsonb NOT NULL,
  category text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create documents table
CREATE TABLE documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content jsonb NOT NULL,
  user_id uuid REFERENCES users(id) NOT NULL,
  template_id uuid REFERENCES templates(id),
  status text DEFAULT 'draft',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create document_shares table
CREATE TABLE document_shares (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid REFERENCES documents(id) NOT NULL,
  shared_with uuid REFERENCES users(id) NOT NULL,
  permission_level text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_shares ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can read own data"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Documents policies
CREATE POLICY "Users can CRUD own documents"
  ON documents
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can read shared documents"
  ON documents
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM document_shares
      WHERE document_id = documents.id
      AND shared_with = auth.uid()
    )
  );

-- Templates policies
CREATE POLICY "Everyone can read templates"
  ON templates
  FOR SELECT
  TO authenticated
  USING (true);

-- Document shares policies
CREATE POLICY "Users can manage their document shares"
  ON document_shares
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM documents
      WHERE documents.id = document_shares.document_id
      AND documents.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view shares they're part of"
  ON document_shares
  FOR SELECT
  TO authenticated
  USING (shared_with = auth.uid());

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for documents table
CREATE TRIGGER update_documents_updated_at
  BEFORE UPDATE
  ON documents
  FOR EACH ROW
  EXECUTE PROCEDURE update_updated_at_column();