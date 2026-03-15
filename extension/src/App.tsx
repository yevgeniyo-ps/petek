import { ExtAuthProvider, useExtAuth } from './components/LoginForm';
import { NotesProvider } from '@shared/context/NotesContext';
import { LabelsProvider } from '@shared/context/LabelsContext';
import { TagsProvider } from '@shared/context/TagsContext';
import { Header } from './components/Header';
import { SearchBar } from './components/SearchBar';
import { NoteList } from './components/NoteList';
import { NoteEditor } from './components/NoteEditor';
import { useState, useEffect, useCallback } from 'react';
import { useNotes } from '@shared/context/NotesContext';
import { Note } from '@shared/types';

type View = 'notes' | 'archive';

function AuthenticatedApp() {
  const [view, setView] = useState<View>('notes');
  const [search, setSearch] = useState('');
  const [filterLabel, setFilterLabel] = useState<string | null>(null);
  const [filterImportant, setFilterImportant] = useState(false);
  const [filterTagIds, setFilterTagIds] = useState<string[]>([]);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const handleFilterLabelChange = (labelId: string | null) => {
    setFilterLabel(labelId);
    setFilterTagIds([]);
  };

  return (
    <NotesProvider>
      <LabelsProvider>
      <TagsProvider>
        <SyncOnFocus />
        <div className="flex flex-col h-screen bg-[#0c0a12]">
          <Header view={view} onViewChange={setView} />
          <SearchBar
            search={search}
            onSearchChange={setSearch}
            filterLabel={filterLabel}
            onFilterLabelChange={handleFilterLabelChange}
            filterImportant={filterImportant}
            onFilterImportantChange={setFilterImportant}
            filterTagIds={filterTagIds}
            onFilterTagIdsChange={setFilterTagIds}
          />
          <NoteList
            view={view}
            search={search}
            filterLabel={filterLabel}
            filterImportant={filterImportant}
            filterTagIds={filterTagIds}
            onEdit={setEditingNote}
            onNew={() => setIsCreating(true)}
          />
          {(editingNote || isCreating) && (
            <NoteEditor
              note={editingNote}
              onClose={() => {
                setEditingNote(null);
                setIsCreating(false);
              }}
            />
          )}
        </div>
      </TagsProvider>
      </LabelsProvider>
    </NotesProvider>
  );
}

function SyncOnFocus() {
  const { refresh } = useNotes();

  const handleVisibility = useCallback(() => {
    if (document.visibilityState === 'visible') {
      refresh();
    }
  }, [refresh]);

  useEffect(() => {
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [handleVisibility]);

  return null;
}

function AppContent() {
  const { user } = useExtAuth();
  if (!user) return null;
  return <AuthenticatedApp />;
}

export default function App() {
  return (
    <ExtAuthProvider>
      <AppContent />
    </ExtAuthProvider>
  );
}
