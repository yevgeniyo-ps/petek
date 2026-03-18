-- ============================================
-- Petek: Shared Challenges
-- ============================================

-- Add invite_code to challenges
ALTER TABLE challenges ADD COLUMN invite_code text UNIQUE DEFAULT NULL;
CREATE INDEX idx_challenges_invite_code ON challenges(invite_code) WHERE invite_code IS NOT NULL;

-- Participants table
CREATE TABLE challenge_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id uuid NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  failed_days jsonb NOT NULL DEFAULT '[]'::jsonb,
  joined_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(challenge_id, user_id)
);

CREATE INDEX idx_challenge_participants_challenge ON challenge_participants(challenge_id);
CREATE INDEX idx_challenge_participants_user ON challenge_participants(user_id);

-- ============================================
-- RLS on challenge_participants
-- ============================================

ALTER TABLE challenge_participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants can view same-challenge participants"
  ON challenge_participants FOR SELECT USING (
    auth.uid() IN (
      SELECT cp.user_id FROM challenge_participants cp WHERE cp.challenge_id = challenge_participants.challenge_id
    )
    OR
    challenge_id IN (SELECT c.id FROM challenges c WHERE c.user_id = auth.uid())
  );

CREATE POLICY "Users can insert own participant row"
  ON challenge_participants FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own participant row"
  ON challenge_participants FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete own row or owner can delete"
  ON challenge_participants FOR DELETE USING (
    user_id = auth.uid()
    OR challenge_id IN (SELECT c.id FROM challenges c WHERE c.user_id = auth.uid())
  );

-- ============================================
-- Update challenges SELECT policy to include participants
-- ============================================

DROP POLICY "Users can view own challenges" ON challenges;

CREATE POLICY "Users can view own or joined challenges"
  ON challenges FOR SELECT USING (
    auth.uid() = user_id
    OR id IN (SELECT cp.challenge_id FROM challenge_participants cp WHERE cp.user_id = auth.uid())
  );

-- ============================================
-- RPC: generate_invite_code
-- ============================================

CREATE OR REPLACE FUNCTION generate_invite_code(p_challenge_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_code text;
  v_owner_id uuid;
  v_existing_code text;
  v_failed_days jsonb;
  v_email text;
BEGIN
  -- Verify ownership
  SELECT user_id, invite_code, failed_days INTO v_owner_id, v_existing_code, v_failed_days
  FROM challenges WHERE id = p_challenge_id;

  IF v_owner_id IS NULL THEN
    RAISE EXCEPTION 'Challenge not found';
  END IF;

  IF v_owner_id != auth.uid() THEN
    RAISE EXCEPTION 'Only the challenge owner can share';
  END IF;

  -- Return existing code if already shared
  IF v_existing_code IS NOT NULL THEN
    RETURN v_existing_code;
  END IF;

  -- Generate unique 6-char code
  LOOP
    v_code := upper(substr(md5(random()::text), 1, 6));
    EXIT WHEN NOT EXISTS (SELECT 1 FROM challenges WHERE invite_code = v_code);
  END LOOP;

  -- Set the code
  UPDATE challenges SET invite_code = v_code WHERE id = p_challenge_id;

  -- Get owner email
  SELECT email INTO v_email FROM auth.users WHERE id = auth.uid();

  -- Add owner as participant (copy existing failed_days)
  INSERT INTO challenge_participants (challenge_id, user_id, email, failed_days)
  VALUES (p_challenge_id, auth.uid(), COALESCE(v_email, ''), COALESCE(v_failed_days, '[]'::jsonb))
  ON CONFLICT (challenge_id, user_id) DO NOTHING;

  RETURN v_code;
END;
$$;

-- ============================================
-- RPC: join_challenge
-- ============================================

CREATE OR REPLACE FUNCTION join_challenge(p_invite_code text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_challenge_id uuid;
  v_status text;
  v_email text;
BEGIN
  -- Find challenge
  SELECT id, status INTO v_challenge_id, v_status
  FROM challenges WHERE invite_code = upper(p_invite_code);

  IF v_challenge_id IS NULL THEN
    RAISE EXCEPTION 'Invalid invite code';
  END IF;

  IF v_status != 'active' THEN
    RAISE EXCEPTION 'This challenge is no longer active';
  END IF;

  -- Get caller email
  SELECT email INTO v_email FROM auth.users WHERE id = auth.uid();

  -- Add as participant
  INSERT INTO challenge_participants (challenge_id, user_id, email, failed_days)
  VALUES (v_challenge_id, auth.uid(), COALESCE(v_email, ''), '[]'::jsonb)
  ON CONFLICT (challenge_id, user_id) DO NOTHING;

  RETURN v_challenge_id;
END;
$$;
