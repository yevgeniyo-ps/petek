import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { useNotes } from '../context/NotesContext';
import NoteBoard from '../components/notes/NoteBoard';
import NoteEditor from '../components/notes/NoteEditor';
import { Note } from '../types';

export default function TrashPage() {
  const { notes, loading, updateNote } = useNotes();
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [search, setSearch] = useState('');

  const trashedNotes = useMemo(() => {
    let filtered = notes.filter(n => n.is_trashed);
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        n => n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q)
      );
    }
    return filtered;
  }, [notes, search]);

  const handleSave = async (data: { title: string; content: string; emoji: string | null }) => {
    if (editingNote) {
      await updateNote(editingNote.id, data);
    }
    setEditingNote(null);
  };

  if (loading) {
    return <div className="text-[#7a7890] text-[14px] text-center pt-40">Loading...</div>;
  }

  return (
    <div className="max-w-[1200px] px-12 py-10">
      <div className="mb-1">
        <h1 className="text-[26px] font-bold text-white leading-tight">Trash</h1>
        <p className="text-[14px] text-[#7a7890] mt-1">Notes in trash are permanently deleted after 7 days</p>
      </div>

      <div className="mt-8 mb-8">
        <div className="relative">
          <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#7a7890]" />
          <input
            type="text"
            placeholder="Search trash..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 pr-5 py-2 bg-transparent border border-[#1c1928] rounded-full text-[13px] text-[#e0dfe4] placeholder-[#4a4660] outline-none focus:border-[#2d2a40] transition-colors w-72"
          />
        </div>
      </div>

      {trashedNotes.length === 0 ? (
        <div className="rounded-xl border border-[#1c1928] bg-[#0f0d18] py-24 text-center">
          <p className="text-[14px] text-[#7a7890]">Trash is empty.</p>
        </div>
      ) : (
        <NoteBoard notes={trashedNotes} onNoteClick={(note) => { setEditingNote(note); setEditorOpen(true); }} />
      )}

      <NoteEditor
        note={editingNote}
        open={editorOpen}
        onClose={() => { setEditorOpen(false); setEditingNote(null); }}
        onSave={handleSave}
      />
    </div>
  );
}
