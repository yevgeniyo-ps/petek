import { supabase } from '../config/supabase';
import { Challenge } from '../types';

export async function fetchChallenges(): Promise<Challenge[]> {
  const { data, error } = await supabase
    .from('challenges')
    .select('*')
    .order('status', { ascending: true })
    .order('end_date', { ascending: true });

  if (error) throw error;
  return data ?? [];
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
