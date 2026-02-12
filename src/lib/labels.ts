import { supabase } from '../config/supabase';
import { Label, NoteLabel } from '../types';

export async function fetchLabels(): Promise<Label[]> {
  const { data, error } = await supabase
    .from('labels')
    .select('*')
    .order('name');

  if (error) throw error;
  return data ?? [];
}

export async function createLabel(name: string): Promise<Label> {
  const { data, error } = await supabase
    .from('labels')
    .insert({ name })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteLabel(id: string): Promise<void> {
  const { error } = await supabase
    .from('labels')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

export async function fetchNoteLabels(): Promise<NoteLabel[]> {
  const { data, error } = await supabase
    .from('note_labels')
    .select('*');

  if (error) throw error;
  return data ?? [];
}

export async function addLabelToNote(noteId: string, labelId: string): Promise<NoteLabel> {
  const { data, error } = await supabase
    .from('note_labels')
    .insert({ note_id: noteId, label_id: labelId })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function removeLabelFromNote(noteId: string, labelId: string): Promise<void> {
  const { error } = await supabase
    .from('note_labels')
    .delete()
    .eq('note_id', noteId)
    .eq('label_id', labelId);

  if (error) throw error;
}
