-- Add display_name to challenge_participants (populated from Google profile)
ALTER TABLE challenge_participants ADD COLUMN display_name text NOT NULL DEFAULT '';

-- Update generate_invite_code to store display name
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
  v_display_name text;
BEGIN
  SELECT user_id, invite_code, failed_days INTO v_owner_id, v_existing_code, v_failed_days
  FROM challenges WHERE id = p_challenge_id;

  IF v_owner_id IS NULL THEN
    RAISE EXCEPTION 'Challenge not found';
  END IF;

  IF v_owner_id != auth.uid() THEN
    RAISE EXCEPTION 'Only the challenge owner can share';
  END IF;

  IF v_existing_code IS NOT NULL THEN
    RETURN v_existing_code;
  END IF;

  LOOP
    v_code := upper(substr(md5(random()::text), 1, 6));
    EXIT WHEN NOT EXISTS (SELECT 1 FROM challenges WHERE invite_code = v_code);
  END LOOP;

  UPDATE challenges SET invite_code = v_code WHERE id = p_challenge_id;

  SELECT email, COALESCE(raw_user_meta_data->>'full_name', raw_user_meta_data->>'name', '')
  INTO v_email, v_display_name
  FROM auth.users WHERE id = auth.uid();

  INSERT INTO challenge_participants (challenge_id, user_id, email, display_name, failed_days)
  VALUES (p_challenge_id, auth.uid(), COALESCE(v_email, ''), COALESCE(v_display_name, ''), COALESCE(v_failed_days, '[]'::jsonb))
  ON CONFLICT (challenge_id, user_id) DO UPDATE SET display_name = COALESCE(v_display_name, '');

  RETURN v_code;
END;
$$;

-- Update join_challenge to store display name
CREATE OR REPLACE FUNCTION join_challenge(p_invite_code text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_challenge_id uuid;
  v_status text;
  v_email text;
  v_display_name text;
BEGIN
  SELECT id, status INTO v_challenge_id, v_status
  FROM challenges WHERE invite_code = upper(p_invite_code);

  IF v_challenge_id IS NULL THEN
    RAISE EXCEPTION 'Invalid invite code';
  END IF;

  IF v_status != 'active' THEN
    RAISE EXCEPTION 'This challenge is no longer active';
  END IF;

  SELECT email, COALESCE(raw_user_meta_data->>'full_name', raw_user_meta_data->>'name', '')
  INTO v_email, v_display_name
  FROM auth.users WHERE id = auth.uid();

  INSERT INTO challenge_participants (challenge_id, user_id, email, display_name, failed_days)
  VALUES (v_challenge_id, auth.uid(), COALESCE(v_email, ''), COALESCE(v_display_name, ''), '[]'::jsonb)
  ON CONFLICT (challenge_id, user_id) DO UPDATE SET display_name = COALESCE(v_display_name, '');

  RETURN v_challenge_id;
END;
$$;
