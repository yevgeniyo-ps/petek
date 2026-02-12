import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Note, NoteColor } from '../../types';
import { NOTE_COLORS, truncateMarkdown, formatDate } from '../../lib/utils';
import { useNotes } from '../../context/NotesContext';
import { useLabels } from '../../context/LabelsContext';
import NoteToolbar from './NoteToolbar';
import ConfirmDialog from '../ui/ConfirmDialog';

interface NoteCardProps {
  note: Note;
  onClick: () => void;
}

export default function NoteCard({ note, onClick }: NoteCardProps) {
  const { updateNote, deleteNote } = useNotes();
  const { getLabelsForNote } = useLabels();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const colorConfig = NOTE_COLORS[note.color as NoteColor] ?? NOTE_COLORS.default;
  const noteLabels = getLabelsForNote(note.id);

  return (
    <>
      <div
        onClick={onClick}
        className="group rounded-xl border cursor-pointer transition-all hover:border-[#2d2a40] flex flex-col min-h-[140px]"
        style={{ backgroundColor: colorConfig.bg, borderColor: colorConfig.border }}
      >
        <div className="p-4 flex-1 min-h-0">
          {note.title && (
            <h3 className="text-[14px] font-semibold text-white mb-2 line-clamp-2">
              {note.title}
            </h3>
          )}
          {note.content && (
            <div className="text-[13px] text-[#9896a8] line-clamp-6 leading-relaxed">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {truncateMarkdown(note.content, 200)}
              </ReactMarkdown>
            </div>
          )}
        </div>

        {noteLabels.length > 0 && (
          <div className="px-4 pb-2 flex flex-wrap gap-1">
            {noteLabels.map(label => (
              <span key={label.id} className="inline-block px-2 py-0.5 rounded-full bg-[#ec4899]/20 text-[#f472b6] text-[10px] font-medium">
                {label.name}
              </span>
            ))}
          </div>
        )}

        <div className="px-3 py-2.5 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
          <NoteToolbar
            isPinned={note.is_pinned}
            isArchived={note.is_archived}
            isTrashed={note.is_trashed}
            onTogglePin={() => updateNote(note.id, { is_pinned: !note.is_pinned })}
            onColorChange={(color) => updateNote(note.id, { color })}
            onTrash={() => note.is_trashed ? setConfirmDelete(true) : updateNote(note.id, { is_trashed: true })}
            onArchive={() => updateNote(note.id, { is_archived: !note.is_archived })}
            onRestore={() => updateNote(note.id, { is_trashed: false })}
            currentColor={note.color}
          />
          <span className="text-[11px] text-[#4a4660]">{formatDate(note.updated_at)}</span>
        </div>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={() => deleteNote(note.id)}
        title="Delete forever?"
        message="This note will be permanently deleted."
      />
    </>
  );
}
