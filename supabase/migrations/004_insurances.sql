-- ============================================
-- Petek: Insurances Schema
-- ============================================

CREATE TABLE insurance_policies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  upload_batch_id uuid NOT NULL,

  category text NOT NULL DEFAULT '',

  identity_number text NOT NULL DEFAULT '',
  main_branch text NOT NULL DEFAULT '',
  sub_branch text NOT NULL DEFAULT '',
  product_type text NOT NULL DEFAULT '',
  company text NOT NULL DEFAULT '',
  coverage_period text NOT NULL DEFAULT '',
  additional_details text NOT NULL DEFAULT '',
  premium_nis numeric(12,2),
  premium_type text NOT NULL DEFAULT '',
  policy_number text NOT NULL DEFAULT '',
  plan_classification text NOT NULL DEFAULT '',

  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_insurance_policies_user_id ON insurance_policies(user_id);
CREATE INDEX idx_insurance_policies_batch ON insurance_policies(upload_batch_id);

-- ============================================
-- Row Level Security
-- ============================================

ALTER TABLE insurance_policies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own insurance policies"
  ON insurance_policies FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own insurance policies"
  ON insurance_policies FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own insurance policies"
  ON insurance_policies FOR DELETE USING (auth.uid() = user_id);
