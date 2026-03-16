-- ============================================
-- Petek: Challenges Schema
-- ============================================

CREATE TABLE challenges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,

  name text NOT NULL,
  start_date date NOT NULL DEFAULT CURRENT_DATE,
  end_date date NOT NULL,
  status text NOT NULL DEFAULT 'active',  -- 'active' | 'completed' | 'failed'

  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_challenges_user_id ON challenges(user_id);

-- ============================================
-- Row Level Security
-- ============================================

ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own challenges"
  ON challenges FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own challenges"
  ON challenges FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own challenges"
  ON challenges FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own challenges"
  ON challenges FOR DELETE USING (auth.uid() = user_id);
