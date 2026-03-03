import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { AlertTriangle } from 'lucide-react';
import { Note } from '../../types';
import { truncateMarkdown, formatDate } from '../../lib/utils';
import { useNotes } from '../../context/NotesContext';
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
  const [confirmDelete, setConfirmDelete] = useState(false);

  const {
    attributes,
    listeners,
    setNodeRef,
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
        {...(overlay ? {} : { ...attributes, ...listeners })}
        onClick={overlay ? undefined : onClick}
        className={`group rounded-xl border bg-[#0c0a12] cursor-pointer transition-all flex flex-col min-h-[140px] relative ${
          note.is_important ? 'border-[#f59e0b]/40 hover:border-[#f59e0b]/60' : 'border-[#1c1928] hover:border-[#2d2a40]'
        } ${overlay ? 'shadow-xl shadow-black/40 scale-[1.03]' : ''}`}
      >

        {note.is_important && (
          <span className="absolute top-3 left-3 text-[#f59e0b] pointer-events-none">
            <AlertTriangle size={14} />
          </span>
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

        <div className="px-3 py-2.5 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
          <NoteToolbar
            isPinned={note.is_pinned}
            isImportant={note.is_important}
            isArchived={note.is_archived}
            onTogglePin={() => updateNote(note.id, { is_pinned: !note.is_pinned })}
            onToggleImportant={() => updateNote(note.id, { is_important: !note.is_important })}
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
