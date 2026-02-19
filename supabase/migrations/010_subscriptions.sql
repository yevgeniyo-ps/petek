-- ============================================
-- Petek: Subscriptions Schema
-- ============================================

CREATE TABLE subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,

  name text NOT NULL,
  amount numeric(12,2) NOT NULL,
  billing_cycle text NOT NULL DEFAULT 'monthly',
  category text NOT NULL DEFAULT 'other',
  next_payment_date date,
  url text NOT NULL DEFAULT '',
  notes text NOT NULL DEFAULT '',
  start_date date,
  auto_renew boolean NOT NULL DEFAULT true,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);

CREATE TRIGGER subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- Row Level Security
-- ============================================

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subscriptions"
  ON subscriptions FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own subscriptions"
  ON subscriptions FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own subscriptions"
  ON subscriptions FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own subscriptions"
  ON subscriptions FOR DELETE USING (auth.uid() = user_id);
