import { Note } from '@shared/types';
import { useNotes } from '@shared/context/NotesContext';
import { Pin, Star, Archive, ArchiveRestore, Trash2, RotateCcw } from 'lucide-react';

interface NoteToolbarProps {
  note: Note;
  onClose: () => void;
}

export function NoteToolbar({ note, onClose }: NoteToolbarProps) {
  const { updateNote, deleteNote } = useNotes();

  const toggle = async (field: 'is_pinned' | 'is_important', value: boolean) => {
    await updateNote(note.id, { [field]: value });
  };

  const archive = async () => {
    await updateNote(note.id, { is_archived: !note.is_archived });
    onClose();
  };

  const trash = async () => {
    await updateNote(note.id, { is_trashed: true });
    onClose();
  };

  const restore = async () => {
    await updateNote(note.id, { is_trashed: false });
    onClose();
  };

  const deletePermanently = async () => {
    await deleteNote(note.id);
    onClose();
  };

  const btnClass = 'p-2 rounded-md text-[#7a7890] hover:text-white hover:bg-white/5 transition-colors';
  const activeClass = 'p-2 rounded-md text-pink-400 hover:text-pink-300 hover:bg-white/5 transition-colors';

  if (note.is_trashed) {
    return (
      <div className="flex items-center gap-1">
        <button onClick={restore} className={btnClass} title="Restore">
          <RotateCcw size={16} />
        </button>
        <button onClick={deletePermanently} className="p-2 rounded-md text-red-400 hover:text-red-300 hover:bg-white/5 transition-colors" title="Delete permanently">
          <Trash2 size={16} />
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={() => toggle('is_pinned', !note.is_pinned)}
        className={note.is_pinned ? activeClass : btnClass}
        title={note.is_pinned ? 'Unpin' : 'Pin'}
      >
        <Pin size={16} />
      </button>
      <button
        onClick={() => toggle('is_important', !note.is_important)}
        className={note.is_important ? activeClass : btnClass}
        title={note.is_important ? 'Unstar' : 'Star'}
      >
        <Star size={16} className={note.is_important ? 'fill-pink-400' : ''} />
      </button>
      <button onClick={archive} className={btnClass} title={note.is_archived ? 'Unarchive' : 'Archive'}>
        {note.is_archived ? <ArchiveRestore size={16} /> : <Archive size={16} />}
      </button>
      <button onClick={trash} className={btnClass} title="Move to trash">
        <Trash2 size={16} />
      </button>
    </div>
  );
}
