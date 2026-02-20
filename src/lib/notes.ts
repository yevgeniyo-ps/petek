import { supabase } from '../config/supabase';
import { Note } from '../types';

export async function fetchNotes(): Promise<Note[]> {
  const { data, error } = await supabase
    .from('notes')
    .select('*')
    .order('is_pinned', { ascending: false })
    .order('position', { ascending: true })
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function createNote(note: Partial<Note>): Promise<Note> {
  const { data, error } = await supabase
    .from('notes')
    .insert({
      title: note.title ?? '',
      content: note.content ?? '',
      emoji: note.emoji ?? null,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateNote(id: string, updates: Partial<Note>): Promise<Note> {
  const { data, error } = await supabase
    .from('notes')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function reorderNotes(updates: { id: string; position: number }[]): Promise<void> {
  const promises = updates.map(({ id, position }) =>
    supabase.from('notes').update({ position }).eq('id', id)
  );
  const results = await Promise.all(promises);
  const error = results.find(r => r.error)?.error;
  if (error) throw error;
}

export async function deleteNotePermanently(id: string): Promise<void> {
  const { error } = await supabase
    .from('notes')
    .delete()
    .eq('id', id);

  if (error) throw error;
}
