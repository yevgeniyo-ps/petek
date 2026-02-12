-- ============================================
-- Petek: Initial Database Schema
-- Run this in Supabase SQL Editor
-- ============================================

-- Notes table
CREATE TABLE notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL DEFAULT '',
  content text NOT NULL DEFAULT '',
  color text NOT NULL DEFAULT 'default',
  is_pinned boolean NOT NULL DEFAULT false,
  is_archived boolean NOT NULL DEFAULT false,
  is_trashed boolean NOT NULL DEFAULT false,
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_notes_user_id ON notes(user_id);
CREATE INDEX idx_notes_user_active ON notes(user_id) WHERE is_trashed = false AND is_archived = false;

-- Labels table
CREATE TABLE labels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, name)
);

CREATE INDEX idx_labels_user_id ON labels(user_id);

-- Junction table
CREATE TABLE note_labels (
  note_id uuid NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
  label_id uuid NOT NULL REFERENCES labels(id) ON DELETE CASCADE,
  PRIMARY KEY (note_id, label_id)
);

-- Auto-update updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER notes_updated_at
  BEFORE UPDATE ON notes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- Row Level Security
-- ============================================

-- NOTES
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notes"
  ON notes FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own notes"
  ON notes FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own notes"
  ON notes FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own notes"
  ON notes FOR DELETE USING (auth.uid() = user_id);

-- LABELS
ALTER TABLE labels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own labels"
  ON labels FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own labels"
  ON labels FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own labels"
  ON labels FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own labels"
  ON labels FOR DELETE USING (auth.uid() = user_id);

-- NOTE_LABELS
ALTER TABLE note_labels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own note_labels"
  ON note_labels FOR SELECT
  USING (EXISTS (SELECT 1 FROM notes WHERE notes.id = note_id AND notes.user_id = auth.uid()));

CREATE POLICY "Users can insert own note_labels"
  ON note_labels FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM notes WHERE notes.id = note_id AND notes.user_id = auth.uid()));

CREATE POLICY "Users can delete own note_labels"
  ON note_labels FOR DELETE
  USING (EXISTS (SELECT 1 FROM notes WHERE notes.id = note_id AND notes.user_id = auth.uid()));
