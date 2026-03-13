-- ============================================
-- Petek: Insurance Profiles (Family Members)
-- ============================================

CREATE TABLE insurance_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  display_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_insurance_profiles_user_id ON insurance_profiles(user_id);

-- ============================================
-- Row Level Security
-- ============================================

ALTER TABLE insurance_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own insurance profiles"
  ON insurance_profiles FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own insurance profiles"
  ON insurance_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own insurance profiles"
  ON insurance_profiles FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own insurance profiles"
  ON insurance_profiles FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- Add profile_id to insurance_policies
-- ============================================

ALTER TABLE insurance_policies
  ADD COLUMN profile_id uuid REFERENCES insurance_profiles(id) ON DELETE CASCADE;

CREATE INDEX idx_insurance_policies_profile ON insurance_policies(profile_id);
