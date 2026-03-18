-- Fix challenge_participants SELECT policy
-- Self-referencing subquery within RLS doesn't work reliably.
-- Use a SECURITY DEFINER helper to check membership.

CREATE OR REPLACE FUNCTION get_my_challenge_ids(p_user_id uuid)
RETURNS SETOF uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT challenge_id FROM challenge_participants WHERE user_id = p_user_id
$$;

DROP POLICY "Participants can view same-challenge participants" ON challenge_participants;

CREATE POLICY "Participants can view same-challenge participants"
  ON challenge_participants FOR SELECT USING (
    challenge_id IN (SELECT get_my_challenge_ids(auth.uid()))
  );
