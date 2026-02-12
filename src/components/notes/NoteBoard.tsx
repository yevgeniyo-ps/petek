import { Note } from '../../types';
import NoteCard from './NoteCard';

interface NoteBoardProps {
  notes: Note[];
  onNoteClick: (note: Note) => void;
  sectionTitle?: string;
}

export default function NoteBoard({ notes, onNoteClick, sectionTitle }: NoteBoardProps) {
  if (notes.length === 0) return null;

  return (
    <div className="mb-8">
      {sectionTitle && (
        <h2 className="text-[11px] font-semibold text-[#7a7890] uppercase tracking-wider mb-4">
          {sectionTitle}
        </h2>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {notes.map(note => (
          <NoteCard key={note.id} note={note} onClick={() => onNoteClick(note)} />
        ))}
      </div>
    </div>
  );
}
