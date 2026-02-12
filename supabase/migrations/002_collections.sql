-- ============================================
-- Petek: Collections Schema
-- Run this in Supabase SQL Editor
-- ============================================

-- Collections table
CREATE TABLE collections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  icon text NOT NULL DEFAULT 'folder',
  slug text NOT NULL,
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, slug)
);

CREATE INDEX idx_collections_user_id ON collections(user_id);

-- Collection fields table
CREATE TABLE collection_fields (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_id uuid NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
  name text NOT NULL,
  field_type text NOT NULL DEFAULT 'text',
  options jsonb NOT NULL DEFAULT '{}',
  position integer NOT NULL DEFAULT 0,
  is_required boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_collection_fields_collection_id ON collection_fields(collection_id);

-- Collection items table
CREATE TABLE collection_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_id uuid NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  data jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_collection_items_collection_id ON collection_items(collection_id);
CREATE INDEX idx_collection_items_user_id ON collection_items(user_id);

-- Auto-update triggers (reuse existing function)
CREATE TRIGGER collections_updated_at
  BEFORE UPDATE ON collections
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER collection_items_updated_at
  BEFORE UPDATE ON collection_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- Row Level Security
-- ============================================

-- COLLECTIONS
ALTER TABLE collections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own collections"
  ON collections FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own collections"
  ON collections FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own collections"
  ON collections FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own collections"
  ON collections FOR DELETE USING (auth.uid() = user_id);

-- COLLECTION_FIELDS
ALTER TABLE collection_fields ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own collection fields"
  ON collection_fields FOR SELECT
  USING (EXISTS (SELECT 1 FROM collections WHERE collections.id = collection_id AND collections.user_id = auth.uid()));

CREATE POLICY "Users can insert own collection fields"
  ON collection_fields FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM collections WHERE collections.id = collection_id AND collections.user_id = auth.uid()));

CREATE POLICY "Users can update own collection fields"
  ON collection_fields FOR UPDATE
  USING (EXISTS (SELECT 1 FROM collections WHERE collections.id = collection_id AND collections.user_id = auth.uid()));

CREATE POLICY "Users can delete own collection fields"
  ON collection_fields FOR DELETE
  USING (EXISTS (SELECT 1 FROM collections WHERE collections.id = collection_id AND collections.user_id = auth.uid()));

-- COLLECTION_ITEMS
ALTER TABLE collection_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own collection items"
  ON collection_items FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own collection items"
  ON collection_items FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own collection items"
  ON collection_items FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own collection items"
  ON collection_items FOR DELETE USING (auth.uid() = user_id);
