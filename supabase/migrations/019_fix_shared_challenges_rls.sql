-- Fix circular RLS dependency between challenges and challenge_participants
-- The challenge_participants SELECT policy referenced challenges, and
-- challenges SELECT policy referenced challenge_participants, causing
-- PostgreSQL to return empty results.

-- Fix: use a SECURITY DEFINER helper to bypass RLS in the subquery

CREATE OR REPLACE FUNCTION is_challenge_participant(p_challenge_id uuid, p_user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM challenge_participants
    WHERE challenge_id = p_challenge_id AND user_id = p_user_id
  );
$$;

-- Recreate challenges SELECT policy using the helper
DROP POLICY "Users can view own or joined challenges" ON challenges;

CREATE POLICY "Users can view own or joined challenges"
  ON challenges FOR SELECT USING (
    auth.uid() = user_id
    OR is_challenge_participant(id, auth.uid())
  );

-- Simplify challenge_participants SELECT policy to avoid referencing challenges
DROP POLICY "Participants can view same-challenge participants" ON challenge_participants;

CREATE POLICY "Participants can view same-challenge participants"
  ON challenge_participants FOR SELECT USING (
    user_id = auth.uid()
    OR challenge_id IN (
      SELECT cp.challenge_id FROM challenge_participants cp WHERE cp.user_id = auth.uid()
    )
  );
