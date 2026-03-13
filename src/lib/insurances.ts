import { supabase } from '../config/supabase';
import { InsurancePolicy } from '../types';

export async function fetchInsurancePolicies(): Promise<InsurancePolicy[]> {
  const { data, error } = await supabase
    .from('insurance_policies')
    .select('*')
    .order('category')
    .order('company')
    .order('main_branch');

  if (error) throw error;
  return data ?? [];
}

export async function replaceInsurancePolicies(
  policies: Omit<InsurancePolicy, 'id' | 'user_id' | 'created_at' | 'profile_id'>[],
  profileId: string
): Promise<InsurancePolicy[]> {
  // Delete existing policies for this profile only
  const { error: deleteError } = await supabase
    .from('insurance_policies')
    .delete()
    .eq('profile_id', profileId);

  if (deleteError) throw deleteError;

  // Insert new policies in batches, tagged to the profile
  const BATCH_SIZE = 50;
  const allInserted: InsurancePolicy[] = [];

  for (let i = 0; i < policies.length; i += BATCH_SIZE) {
    const batch = policies.slice(i, i + BATCH_SIZE).map(p => ({
      ...p,
      profile_id: profileId,
    }));
    const { data, error } = await supabase
      .from('insurance_policies')
      .insert(batch)
      .select();

    if (error) throw error;
    if (data) allInserted.push(...data);
  }

  return allInserted;
}

export async function deleteInsurancePoliciesByProfile(profileId: string): Promise<void> {
  const { error } = await supabase
    .from('insurance_policies')
    .delete()
    .eq('profile_id', profileId);

  if (error) throw error;
}

export async function deleteAllInsurancePolicies(): Promise<void> {
  const { error } = await supabase
    .from('insurance_policies')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000');

  if (error) throw error;
}
