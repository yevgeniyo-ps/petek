import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import { Note } from '../../types';
import { truncateMarkdown, formatDate } from '../../lib/utils';
import { useNotes } from '../../context/NotesContext';
import { useLabels } from '../../context/LabelsContext';
import NoteToolbar from './NoteToolbar';
import ConfirmDialog from '../ui/ConfirmDialog';
import { ICON_MAP } from '../ui/IconPicker';

interface NoteCardProps {
  note: Note;
  onClick: () => void;
  overlay?: boolean;
}

export default function NoteCard({ note, onClick, overlay }: NoteCardProps) {
  const { updateNote, deleteNote } = useNotes();
  const { getLabelsForNote } = useLabels();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const noteLabels = getLabelsForNote(note.id);

  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: note.id });

  const style = overlay ? undefined : {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0 : undefined,
  };

  return (
    <>
      <div
        ref={overlay ? undefined : setNodeRef}
        style={style}
        {...(overlay ? {} : attributes)}
        onClick={overlay ? undefined : onClick}
        className={`group rounded-xl border border-[#1c1928] bg-[#13111c] cursor-pointer transition-all hover:border-[#2d2a40] flex flex-col min-h-[140px] relative ${
          overlay ? 'shadow-xl shadow-black/40 scale-[1.03]' : ''
        }`}
      >
        {/* Drag handle — visible on hover */}
        {!overlay && (
          <button
            ref={setActivatorNodeRef}
            {...listeners}
            className="absolute top-2 left-2 z-10 p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity text-[#4a4660] hover:text-[#7a7890] hover:bg-[#1c1928] cursor-grab active:cursor-grabbing"
            onClick={e => e.stopPropagation()}
            aria-label="Drag to reorder"
          >
            <GripVertical size={14} />
          </button>
        )}

        {note.emoji && ICON_MAP[note.emoji] && (() => {
          const Icon = ICON_MAP[note.emoji!]!;
          return (
            <span className="absolute top-3 right-3 text-[#4a4660] pointer-events-none">
              <Icon size={20} />
            </span>
          );
        })()}
        <div className="p-4 flex-1 min-h-0">
          {note.title && (
            <h3 className="text-[14px] font-semibold text-white mb-2 line-clamp-2 pr-8">
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
            onTogglePin={() => updateNote(note.id, { is_pinned: !note.is_pinned })}
            onEmojiChange={(emoji) => updateNote(note.id, { emoji })}
            onArchive={() => updateNote(note.id, { is_archived: true })}
            onRestore={() => updateNote(note.id, { is_archived: false })}
            onDelete={() => setConfirmDelete(true)}
            currentEmoji={note.emoji}
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
