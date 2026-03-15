-- Tags: sub-filters under categories (labels)

CREATE TABLE tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  label_id uuid NOT NULL REFERENCES labels(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id),
  name text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(label_id, name)
);

CREATE INDEX idx_tags_user_id ON tags(user_id);
CREATE INDEX idx_tags_label_id ON tags(label_id);

ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own tags" ON tags FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own tags" ON tags FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own tags" ON tags FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own tags" ON tags FOR DELETE USING (auth.uid() = user_id);

CREATE TABLE note_tags (
  note_id uuid NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
  tag_id uuid NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (note_id, tag_id)
);

ALTER TABLE note_tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own note_tags" ON note_tags FOR SELECT
  USING (note_id IN (SELECT id FROM notes WHERE user_id = auth.uid()));
CREATE POLICY "Users can insert own note_tags" ON note_tags FOR INSERT
  WITH CHECK (note_id IN (SELECT id FROM notes WHERE user_id = auth.uid()));
CREATE POLICY "Users can delete own note_tags" ON note_tags FOR DELETE
  USING (note_id IN (SELECT id FROM notes WHERE user_id = auth.uid()));
