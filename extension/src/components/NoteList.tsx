import { useMemo } from 'react';
import { useNotes } from '@shared/context/NotesContext';
import { useLabels } from '@shared/context/LabelsContext';
import { Note } from '@shared/types';
import { NoteCard } from './NoteCard';
import { Plus, FileText } from 'lucide-react';

type View = 'notes' | 'archive' | 'trash';

interface NoteListProps {
  view: View;
  search: string;
  filterLabel: string | null;
  filterImportant: boolean;
  onEdit: (note: Note) => void;
  onNew: () => void;
}

export function NoteList({ view, search, filterLabel, filterImportant, onEdit, onNew }: NoteListProps) {
  const { notes, loading } = useNotes();
  const { getNoteIdsForLabel } = useLabels();

  const filtered = useMemo(() => {
    let result = notes.filter(n => {
      if (view === 'notes') return !n.is_archived && !n.is_trashed;
      if (view === 'archive') return n.is_archived && !n.is_trashed;
      if (view === 'trash') return n.is_trashed;
      return false;
    });

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(n =>
        n.title.toLowerCase().includes(q) ||
        n.content.toLowerCase().includes(q)
      );
    }

    if (filterImportant) {
      result = result.filter(n => n.is_important);
    }

    if (filterLabel) {
      const noteIds = new Set(getNoteIdsForLabel(filterLabel));
      result = result.filter(n => noteIds.has(n.id));
    }

    // Pinned first, then by position
    return result.sort((a, b) => {
      if (a.is_pinned !== b.is_pinned) return a.is_pinned ? -1 : 1;
      return a.position - b.position;
    });
  }, [notes, view, search, filterImportant, filterLabel, getNoteIdsForLabel]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-5 h-5 border-2 border-pink-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto relative">
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full text-[#4a4660]">
          <FileText size={32} className="mb-2 opacity-50" />
          <p className="text-sm">
            {search ? 'No matching notes' : view === 'notes' ? 'No notes yet' : `No ${view} notes`}
          </p>
        </div>
      ) : (
        <div className="p-3 space-y-2">
          {filtered.map(note => (
            <NoteCard
              key={note.id}
              note={note}
              onClick={() => onEdit(note)}
            />
          ))}
        </div>
      )}

      {/* FAB for new note */}
      {view === 'notes' && (
        <button
          onClick={onNew}
          className="absolute bottom-4 right-4 w-11 h-11 bg-pink-500 hover:bg-pink-600 text-white rounded-full shadow-lg flex items-center justify-center transition-colors"
        >
          <Plus size={20} />
        </button>
      )}
    </div>
  );
}
