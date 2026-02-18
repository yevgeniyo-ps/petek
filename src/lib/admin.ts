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

export async function suspendUser(userId: string): Promise<void> {
  const { error } = await supabase.rpc('admin_suspend_user', { target_user_id: userId });
  if (error) throw error;
}

export async function unsuspendUser(userId: string): Promise<void> {
  const { error } = await supabase.rpc('admin_unsuspend_user', { target_user_id: userId });
  if (error) throw error;
}

export async function checkIsApproved(): Promise<boolean> {
  const { data, error } = await supabase.rpc('is_approved');
  if (error) return false;
  return data === true;
}

export async function approveUser(userId: string): Promise<void> {
  const { error } = await supabase.rpc('admin_approve_user', { target_user_id: userId });
  if (error) throw error;
}

export async function removeUser(userId: string): Promise<void> {
  const { error } = await supabase.rpc('admin_remove_user', { target_user_id: userId });
  if (error) throw error;
}
