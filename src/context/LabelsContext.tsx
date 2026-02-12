import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { Label, NoteLabel } from '../types';
import { useAuth } from './AuthContext';
import * as labelsApi from '../lib/labels';

interface LabelsContextType {
  labels: Label[];
  noteLabels: NoteLabel[];
  createLabel: (name: string) => Promise<Label>;
  deleteLabel: (id: string) => Promise<void>;
  addLabelToNote: (noteId: string, labelId: string) => Promise<void>;
  removeLabelFromNote: (noteId: string, labelId: string) => Promise<void>;
  getLabelsForNote: (noteId: string) => Label[];
  getNoteIdsForLabel: (labelId: string) => string[];
}

const LabelsContext = createContext<LabelsContextType | undefined>(undefined);

export function LabelsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [labels, setLabels] = useState<Label[]>([]);
  const [noteLabels, setNoteLabels] = useState<NoteLabel[]>([]);

  const refresh = useCallback(async () => {
    if (!user) return;
    const [labelsData, noteLabelsData] = await Promise.all([
      labelsApi.fetchLabels(),
      labelsApi.fetchNoteLabels(),
    ]);
    setLabels(labelsData);
    setNoteLabels(noteLabelsData);
  }, [user]);

  useEffect(() => {
    if (user) {
      refresh();
    } else {
      setLabels([]);
      setNoteLabels([]);
    }
  }, [user, refresh]);

  const createLabel = async (name: string) => {
    const created = await labelsApi.createLabel(name);
    setLabels(prev => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
    return created;
  };

  const deleteLabel = async (id: string) => {
    await labelsApi.deleteLabel(id);
    setLabels(prev => prev.filter(l => l.id !== id));
    setNoteLabels(prev => prev.filter(nl => nl.label_id !== id));
  };

  const addLabelToNote = async (noteId: string, labelId: string) => {
    await labelsApi.addLabelToNote(noteId, labelId);
    setNoteLabels(prev => [...prev, { note_id: noteId, label_id: labelId }]);
  };

  const removeLabelFromNote = async (noteId: string, labelId: string) => {
    await labelsApi.removeLabelFromNote(noteId, labelId);
    setNoteLabels(prev => prev.filter(nl => !(nl.note_id === noteId && nl.label_id === labelId)));
  };

  const getLabelsForNote = useCallback((noteId: string) => {
    const labelIds = noteLabels.filter(nl => nl.note_id === noteId).map(nl => nl.label_id);
    return labels.filter(l => labelIds.includes(l.id));
  }, [labels, noteLabels]);

  const getNoteIdsForLabel = useCallback((labelId: string) => {
    return noteLabels.filter(nl => nl.label_id === labelId).map(nl => nl.note_id);
  }, [noteLabels]);

  return (
    <LabelsContext.Provider value={{
      labels, noteLabels, createLabel, deleteLabel,
      addLabelToNote, removeLabelFromNote,
      getLabelsForNote, getNoteIdsForLabel,
    }}>
      {children}
    </LabelsContext.Provider>
  );
}

export function useLabels() {
  const context = useContext(LabelsContext);
  if (!context) throw new Error('useLabels must be used within LabelsProvider');
  return context;
}
