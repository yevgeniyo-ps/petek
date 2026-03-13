import { supabase } from '../config/supabase';
import { InsuranceProfile } from '../types';

export async function fetchProfiles(): Promise<InsuranceProfile[]> {
  const { data, error } = await supabase
    .from('insurance_profiles')
    .select('*')
    .order('display_order')
    .order('created_at');

  if (error) throw error;
  return data ?? [];
}

export async function createProfile(name: string, displayOrder: number): Promise<InsuranceProfile> {
  const { data, error } = await supabase
    .from('insurance_profiles')
    .insert({ name, display_order: displayOrder })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateProfile(id: string, updates: { name?: string; display_order?: number }): Promise<void> {
  const { error } = await supabase
    .from('insurance_profiles')
    .update(updates)
    .eq('id', id);

  if (error) throw error;
}

export async function deleteProfile(id: string): Promise<void> {
  const { error } = await supabase
    .from('insurance_profiles')
    .delete()
    .eq('id', id);

  if (error) throw error;
}
