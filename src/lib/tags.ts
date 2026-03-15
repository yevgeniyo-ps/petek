import { supabase } from '../config/supabase';
import { Tag, NoteTag } from '../types';

export async function fetchTags(): Promise<Tag[]> {
  const { data, error } = await supabase
    .from('tags')
    .select('*')
    .order('name');

  if (error) throw error;
  return data ?? [];
}

export async function createTag(labelId: string, name: string): Promise<Tag> {
  const { data, error } = await supabase
    .from('tags')
    .insert({ label_id: labelId, name })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteTag(id: string): Promise<void> {
  const { error } = await supabase
    .from('tags')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

export async function fetchNoteTags(): Promise<NoteTag[]> {
  const { data, error } = await supabase
    .from('note_tags')
    .select('*');

  if (error) throw error;
  return data ?? [];
}

export async function addTagToNote(noteId: string, tagId: string): Promise<NoteTag> {
  const { data, error } = await supabase
    .from('note_tags')
    .insert({ note_id: noteId, tag_id: tagId })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function removeTagFromNote(noteId: string, tagId: string): Promise<void> {
  const { error } = await supabase
    .from('note_tags')
    .delete()
    .eq('note_id', noteId)
    .eq('tag_id', tagId);

  if (error) throw error;
}
