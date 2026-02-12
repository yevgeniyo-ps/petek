import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { Note } from '../types';
import { useAuth } from './AuthContext';
import * as notesApi from '../lib/notes';

interface NotesContextType {
  notes: Note[];
  loading: boolean;
  error: string | null;
  createNote: (note: Partial<Note>) => Promise<void>;
  updateNote: (id: string, updates: Partial<Note>) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;
  refresh: () => Promise<void>;
}

const NotesContext = createContext<NotesContextType | undefined>(undefined);

export function NotesProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!user) return;
    try {
      setError(null);
      const data = await notesApi.fetchNotes();
      setNotes(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load notes');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      refresh();
    } else {
      setNotes([]);
      setLoading(false);
    }
  }, [user, refresh]);

  const createNote = async (note: Partial<Note>) => {
    const created = await notesApi.createNote(note);
    setNotes(prev => [created, ...prev]);
  };

  const updateNote = async (id: string, updates: Partial<Note>) => {
    const updated = await notesApi.updateNote(id, updates);
    setNotes(prev => prev.map(n => n.id === id ? updated : n));
  };

  const deleteNote = async (id: string) => {
    await notesApi.deleteNotePermanently(id);
    setNotes(prev => prev.filter(n => n.id !== id));
  };

  return (
    <NotesContext.Provider value={{ notes, loading, error, createNote, updateNote, deleteNote, refresh }}>
      {children}
    </NotesContext.Provider>
  );
}

export function useNotes() {
  const context = useContext(NotesContext);
  if (!context) throw new Error('useNotes must be used within NotesProvider');
  return context;
}
