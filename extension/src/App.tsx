import { LanguageProvider } from '@shared/i18n';
import { ExtAuthProvider, useExtAuth } from './components/LoginForm';
import { FeaturesProvider, useFeatures } from '@shared/context/FeaturesContext';
import { NotesProvider } from '@shared/context/NotesContext';
import { LabelsProvider, useLabels } from '@shared/context/LabelsContext';
import { TagsProvider } from '@shared/context/TagsContext';
import { ChallengesProvider } from '@shared/context/ChallengesContext';
import { Header, type View } from './components/Header';
import { SearchBar } from './components/SearchBar';
import { NoteList } from './components/NoteList';
import { NoteEditor } from './components/NoteEditor';
import { ChallengeList } from './components/ChallengeList';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useNotes } from '@shared/context/NotesContext';
import { Note } from '@shared/types';

function AuthenticatedApp() {
  return (
    <FeaturesProvider>
      <NotesProvider>
        <LabelsProvider>
        <TagsProvider>
        <ChallengesProvider>
          <SyncOnFocus />
          <AppInner />
        </ChallengesProvider>
        </TagsProvider>
        </LabelsProvider>
      </NotesProvider>
    </FeaturesProvider>
  );
}

function AppInner() {
  const { labels } = useLabels();
  const { hasFeature, loading: featuresLoading } = useFeatures();

  const [view, setView] = useState<View | null>(null);
  const [search, setSearch] = useState('');
  const [filterLabel, setFilterLabel] = useState<string | null>(null);
  const [filterImportant, setFilterImportant] = useState(false);
  const [filterTagIds, setFilterTagIds] = useState<string[]>([]);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const defaultApplied = useRef(false);

  // Set initial view once features load
  useEffect(() => {
    if (featuresLoading) return;
    setView(prev => {
      if (prev && ((prev === 'notes' && hasFeature('notes')) || (prev === 'challenges' && hasFeature('challenges')))) return prev;
      return hasFeature('challenges') ? 'challenges' : 'notes';
    });
  }, [featuresLoading, hasFeature]);

  // Default to "challenge" label once labels load
  useEffect(() => {
    if (!defaultApplied.current && labels.length > 0) {
      const challenge = labels.find(l => l.name.toLowerCase() === 'challenge');
      if (challenge) setFilterLabel(challenge.id);
      defaultApplied.current = true;
    }
  }, [labels]);

  const handleFilterLabelChange = (labelId: string | null) => {
    setFilterLabel(labelId);
    setFilterTagIds([]);
  };

  if (!view) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#0c0a12]">
        <div className="w-5 h-5 border-2 border-pink-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-[#0c0a12]">
      <Header view={view} onViewChange={setView} />
      {view === 'challenges' ? (
        <ChallengeList />
      ) : (
        <>
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
            view="notes"
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
        </>
      )}
    </div>
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
    <LanguageProvider>
      <ExtAuthProvider>
        <AppContent />
      </ExtAuthProvider>
    </LanguageProvider>
  );
}
