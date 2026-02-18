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
  policies: Omit<InsurancePolicy, 'id' | 'user_id' | 'created_at'>[]
): Promise<InsurancePolicy[]> {
  // Delete all existing policies for this user (RLS scopes to current user)
  const { error: deleteError } = await supabase
    .from('insurance_policies')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000');

  if (deleteError) throw deleteError;

  // Insert new policies in batches
  const BATCH_SIZE = 50;
  const allInserted: InsurancePolicy[] = [];

  for (let i = 0; i < policies.length; i += BATCH_SIZE) {
    const batch = policies.slice(i, i + BATCH_SIZE);
    const { data, error } = await supabase
      .from('insurance_policies')
      .insert(batch)
      .select();

    if (error) throw error;
    if (data) allInserted.push(...data);
  }

  return allInserted;
}

export async function deleteAllInsurancePolicies(): Promise<void> {
  const { error } = await supabase
    .from('insurance_policies')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000');

  if (error) throw error;
}
