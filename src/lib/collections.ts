import { supabase } from '../config/supabase';
import { Collection, CollectionField, CollectionItem } from '../types';

// ── Collections ──

export async function fetchCollections(): Promise<Collection[]> {
  const { data, error } = await supabase
    .from('collections')
    .select('*')
    .order('position')
    .order('created_at');

  if (error) throw error;
  return data ?? [];
}

export async function createCollection(collection: {
  name: string;
  icon: string;
  slug: string;
  position?: number;
}): Promise<Collection> {
  const { data, error } = await supabase
    .from('collections')
    .insert(collection)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateCollection(
  id: string,
  updates: Partial<Pick<Collection, 'name' | 'icon' | 'slug' | 'position'>>
): Promise<Collection> {
  const { data, error } = await supabase
    .from('collections')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteCollection(id: string): Promise<void> {
  const { error } = await supabase
    .from('collections')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// ── Fields ──

export async function fetchFields(collectionId: string): Promise<CollectionField[]> {
  const { data, error } = await supabase
    .from('collection_fields')
    .select('*')
    .eq('collection_id', collectionId)
    .order('position');

  if (error) throw error;
  return data ?? [];
}

export async function fetchAllFields(): Promise<CollectionField[]> {
  const { data, error } = await supabase
    .from('collection_fields')
    .select('*')
    .order('position');

  if (error) throw error;
  return data ?? [];
}

export async function createField(field: {
  collection_id: string;
  name: string;
  field_type: string;
  options?: Record<string, unknown>;
  position?: number;
  is_required?: boolean;
}): Promise<CollectionField> {
  const { data, error } = await supabase
    .from('collection_fields')
    .insert(field)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateField(
  id: string,
  updates: Partial<Pick<CollectionField, 'name' | 'field_type' | 'options' | 'position' | 'is_required'>>
): Promise<CollectionField> {
  const { data, error } = await supabase
    .from('collection_fields')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteField(id: string): Promise<void> {
  const { error } = await supabase
    .from('collection_fields')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// ── Items ──

export async function fetchItems(collectionId: string): Promise<CollectionItem[]> {
  const { data, error } = await supabase
    .from('collection_items')
    .select('*')
    .eq('collection_id', collectionId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function createItem(item: {
  collection_id: string;
  data: Record<string, unknown>;
}): Promise<CollectionItem> {
  const { data, error } = await supabase
    .from('collection_items')
    .insert(item)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateItem(
  id: string,
  updates: { data: Record<string, unknown> }
): Promise<CollectionItem> {
  const { data, error } = await supabase
    .from('collection_items')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteItem(id: string): Promise<void> {
  const { error } = await supabase
    .from('collection_items')
    .delete()
    .eq('id', id);

  if (error) throw error;
}
