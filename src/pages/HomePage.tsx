import { useState, useMemo } from 'react';
import { Search, Plus, Archive } from 'lucide-react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useNotes } from '../context/NotesContext';
import { useLabels } from '../context/LabelsContext';
import NoteBoard from '../components/notes/NoteBoard';
import NoteEditor from '../components/notes/NoteEditor';
import { Note } from '../types';

export default function HomePage() {
  const { notes, loading, createNote, updateNote } = useNotes();
  const { getNoteIdsForLabel } = useLabels();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [search, setSearch] = useState('');
  const selectedTagId = searchParams.get('tag');

  const activeNotes = useMemo(() => {
    let filtered = notes.filter(n => !n.is_archived);
    if (selectedTagId) {
      const noteIds = getNoteIdsForLabel(selectedTagId);
      filtered = filtered.filter(n => noteIds.includes(n.id));
    }
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        n => n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q)
      );
    }
    return filtered;
  }, [notes, search, selectedTagId, getNoteIdsForLabel]);

  const pinned = activeNotes.filter(n => n.is_pinned);
  const others = activeNotes.filter(n => !n.is_pinned);

  const handleSave = async (data: { title: string; content: string; emoji: string | null }) => {
    if (editingNote) {
      await updateNote(editingNote.id, data);
    } else {
      await createNote(data);
    }
    setEditingNote(null);
  };

  const handleNoteClick = (note: Note) => {
    setEditingNote(note);
    setEditorOpen(true);
  };

  const handleNewNote = () => {
    setEditingNote(null);
    setEditorOpen(true);
  };

  if (loading) {
    return <div className="text-[#7a7890] text-[14px] text-center pt-40">Loading notes...</div>;
  }

  return (
    <div className="max-w-[1200px] px-12 py-10">
      {/* Page header */}
      <div className="mb-1">
        <h1 className="text-[26px] font-bold text-white leading-tight">Notes</h1>
        <p className="text-[14px] text-[#7a7890] mt-1">Create and manage your markdown notes</p>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between mt-8 mb-8">
        <div className="relative">
          <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#7a7890]" />
          <input
            type="text"
            placeholder="Search notes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 pr-5 py-2 bg-transparent border border-[#1c1928] rounded-full text-[13px] text-[#e0dfe4] placeholder-[#4a4660] outline-none focus:border-[#2d2a40] transition-colors w-72"
          />
        </div>

      </div>

      {/* Content */}
      {activeNotes.length === 0 ? (
        <div className="rounded-xl border border-[#1c1928] bg-[#0f0d18] py-24 text-center">
          <p className="text-[14px] text-[#7a7890]">
            {search ? 'No notes found matching your criteria.' : 'No notes yet. Create one to get started.'}
          </p>
        </div>
      ) : (
        <>
          <NoteBoard notes={pinned} onNoteClick={handleNoteClick} sectionTitle={pinned.length > 0 ? 'Pinned' : undefined} />
          <NoteBoard notes={others} onNoteClick={handleNoteClick} sectionTitle={pinned.length > 0 ? 'Others' : undefined} />
        </>
      )}

      {/* Archive link */}
      {notes.some(n => n.is_archived) && (
        <button
          onClick={() => navigate('/archive')}
          className="mt-10 mx-auto flex items-center gap-2 text-[13px] text-[#7a7890] hover:text-[#b0adc0] transition-colors"
        >
          <Archive size={14} />
          <span>{notes.filter(n => n.is_archived).length} archived notes</span>
        </button>
      )}

      <NoteEditor
        note={editingNote}
        open={editorOpen}
        onClose={() => { setEditorOpen(false); setEditingNote(null); }}
        onSave={handleSave}
      />

      <button
        onClick={handleNewNote}
        className="fixed bottom-8 right-8 w-14 h-14 rounded-full bg-[#ec4899] hover:bg-[#db2777] text-white shadow-lg shadow-[#ec4899]/25 hover:shadow-[#ec4899]/40 transition-all flex items-center justify-center z-30"
        title="New Note"
      >
        <Plus size={24} strokeWidth={2.5} />
      </button>
    </div>
  );
}
