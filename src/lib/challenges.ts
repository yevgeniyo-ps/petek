import { supabase } from '../config/supabase';
import { Challenge, ChallengeParticipant } from '../types';

export async function fetchChallenges(): Promise<Challenge[]> {
  const { data, error } = await supabase
    .from('challenges')
    .select('*')
    .order('status', { ascending: true })
    .order('end_date', { ascending: true });

  if (error) throw error;
  const challenges: Challenge[] = data ?? [];

  // Fetch participants for shared challenges
  const sharedIds = challenges.filter(c => c.invite_code).map(c => c.id);
  if (sharedIds.length > 0) {
    const { data: participants, error: pErr } = await supabase
      .from('challenge_participants')
      .select('*')
      .in('challenge_id', sharedIds)
      .order('joined_at', { ascending: true });

    if (!pErr && participants) {
      const byChallenge = new Map<string, ChallengeParticipant[]>();
      for (const p of participants) {
        const list = byChallenge.get(p.challenge_id) || [];
        list.push(p);
        byChallenge.set(p.challenge_id, list);
      }
      for (const c of challenges) {
        if (c.invite_code) {
          c.participants = byChallenge.get(c.id) || [];
        }
      }
    }
  }

  return challenges;
}

export async function createChallenge(
  challenge: Pick<Challenge, 'name' | 'start_date' | 'end_date'>
): Promise<Challenge> {
  const { data, error } = await supabase
    .from('challenges')
    .insert(challenge)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateChallenge(
  id: string,
  updates: Partial<Pick<Challenge, 'name' | 'start_date' | 'end_date' | 'status' | 'failed_days'>>
): Promise<Challenge> {
  const { data, error } = await supabase
    .from('challenges')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteChallenge(id: string): Promise<void> {
  const { error } = await supabase
    .from('challenges')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

export async function generateInviteCode(challengeId: string): Promise<string> {
  const { data, error } = await supabase.rpc('generate_invite_code', {
    p_challenge_id: challengeId,
  });

  if (error) throw error;
  return data as string;
}

export async function joinChallenge(inviteCode: string): Promise<string> {
  const { data, error } = await supabase.rpc('join_challenge', {
    p_invite_code: inviteCode,
  });

  if (error) throw error;
  return data as string;
}

export async function updateParticipantFailedDays(
  participantId: string,
  failedDays: string[]
): Promise<void> {
  const { error } = await supabase
    .from('challenge_participants')
    .update({ failed_days: failedDays })
    .eq('id', participantId);

  if (error) throw error;
}

export async function leaveChallenge(challengeId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('challenge_participants')
    .delete()
    .eq('challenge_id', challengeId)
    .eq('user_id', user.id);

  if (error) throw error;
}
