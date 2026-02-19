import { supabase } from '../config/supabase';
import { Subscription } from '../types';

export async function fetchSubscriptions(): Promise<Subscription[]> {
  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .order('next_payment_date', { ascending: true, nullsFirst: false });

  if (error) throw error;
  return data ?? [];
}

export async function createSubscription(
  sub: Omit<Subscription, 'id' | 'user_id' | 'created_at' | 'updated_at'>
): Promise<Subscription> {
  const { data, error } = await supabase
    .from('subscriptions')
    .insert(sub)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateSubscription(
  id: string,
  updates: Partial<Omit<Subscription, 'id' | 'user_id' | 'created_at' | 'updated_at'>>
): Promise<Subscription> {
  const { data, error } = await supabase
    .from('subscriptions')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteSubscription(id: string): Promise<void> {
  const { error } = await supabase
    .from('subscriptions')
    .delete()
    .eq('id', id);

  if (error) throw error;
}
