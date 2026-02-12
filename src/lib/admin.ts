import { supabase } from '../config/supabase';
import { AdminUser } from '../types';

export async function checkIsAdmin(): Promise<boolean> {
  const { data, error } = await supabase.rpc('is_admin');
  if (error) return false;
  return data === true;
}

export async function fetchUsers(): Promise<AdminUser[]> {
  const { data, error } = await supabase.rpc('admin_get_users');
  if (error) throw error;
  return data ?? [];
}

export async function deleteUserData(userId: string): Promise<void> {
  const { error } = await supabase.rpc('admin_delete_user_data', { target_user_id: userId });
  if (error) throw error;
}
