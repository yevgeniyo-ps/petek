import { ExtAuthProvider, useExtAuth } from './components/LoginForm';
import { NotesProvider } from '@shared/context/NotesContext';
import { LabelsProvider } from '@shared/context/LabelsContext';
import { Header } from './components/Header';
import { SearchBar } from './components/SearchBar';
import { NoteList } from './components/NoteList';
import { NoteEditor } from './components/NoteEditor';
import { useState } from 'react';
import { Note } from '@shared/types';

type View = 'notes' | 'archive' | 'trash';

function AuthenticatedApp() {
  const [view, setView] = useState<View>('notes');
  const [search, setSearch] = useState('');
  const [filterLabel, setFilterLabel] = useState<string | null>(null);
  const [filterImportant, setFilterImportant] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  return (
    <NotesProvider>
      <LabelsProvider>
        <div className="flex flex-col h-screen bg-[#0c0a12]">
          <Header view={view} onViewChange={setView} />
          <SearchBar
            search={search}
            onSearchChange={setSearch}
            filterLabel={filterLabel}
            onFilterLabelChange={setFilterLabel}
            filterImportant={filterImportant}
            onFilterImportantChange={setFilterImportant}
          />
          <NoteList
            view={view}
            search={search}
            filterLabel={filterLabel}
            filterImportant={filterImportant}
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
      </LabelsProvider>
    </NotesProvider>
  );
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
