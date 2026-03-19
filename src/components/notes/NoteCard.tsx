import { useState, memo } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Star } from 'lucide-react';
import { Note } from '../../types';
import { stripMarkdown, truncateMarkdown, formatDate } from '../../lib/utils';
import { useNotes } from '../../context/NotesContext';
import { useLabels } from '../../context/LabelsContext';
import { useTags } from '../../context/TagsContext';
import NoteToolbar from './NoteToolbar';
import ConfirmDialog from '../ui/ConfirmDialog';
import { ICON_MAP } from '../ui/IconPicker';
import { useLanguage } from '../../i18n';

interface NoteCardProps {
  note: Note;
  onClick: () => void;
  overlay?: boolean;
}

function NoteCard({ note, onClick, overlay }: NoteCardProps) {
  const { t, language } = useLanguage();
  const localeMap: Record<string, string> = { en: 'en-US', ru: 'ru-RU', he: 'he-IL', es: 'es-ES' };
  const { updateNote, deleteNote } = useNotes();
  const { labels: allLabels, getLabelsForNote, addLabelToNote, removeLabelFromNote } = useLabels();
  const { getTagsForNote } = useTags();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const labels = getLabelsForNote(note.id);
  const currentLabelId = labels[0]?.id ?? null;
  const tags = getTagsForNote(note.id);

  const handleLabelChange = async (labelId: string | null) => {
    if (currentLabelId) await removeLabelFromNote(note.id, currentLabelId);
    if (labelId) await addLabelToNote(note.id, labelId);
  };

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
          note.is_important ? 'border-[#ec4899]/40 hover:border-[#ec4899]/60' : 'border-[#3a3650] hover:border-[#4d4870]'
        } ${overlay ? 'shadow-xl shadow-black/40 scale-[1.03]' : ''}`}
      >

        {note.is_important && (
          <span className="absolute top-3 right-3 text-[#ec4899] pointer-events-none">
            <Star size={14} className="fill-[#ec4899]" />
          </span>
        )}
        {note.emoji && ICON_MAP[note.emoji] && (() => {
          const Icon = ICON_MAP[note.emoji!]!;
          return (
            <span className={`absolute top-3 pointer-events-none text-[#4a4660] ${note.is_important ? 'right-9' : 'right-3'}`}>
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
            <p className="text-[13px] text-[#9896a8] line-clamp-6 leading-relaxed whitespace-pre-line">
              {truncateMarkdown(stripMarkdown(note.content), 200)}
            </p>
          )}
        </div>

        {(labels.length > 0 || tags.length > 0) && (
          <div className="px-4 pb-1 flex items-center gap-1.5 flex-wrap">
            {labels.map(label => (
              <span key={label.id} className="px-2 py-0.5 bg-white/[0.04] rounded text-[11px] text-[#7a7890]">
                {label.name}
              </span>
            ))}
            {tags.map(tag => (
              <span key={tag.id} className="px-1.5 py-0.5 bg-[#ec4899]/10 rounded text-[10px] text-[#c084a8]">
                {tag.name}
              </span>
            ))}
          </div>
        )}

        <div className="px-3 py-2.5 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()} onPointerDown={e => e.stopPropagation()}>
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
            labels={allLabels}
            currentLabelId={currentLabelId}
            onLabelChange={handleLabelChange}
          />
          <span className="text-[11px] text-[#4a4660]">{formatDate(note.updated_at, localeMap[language], { yesterday: t.common.yesterday, daysAgo: t.common.daysAgo })}</span>
        </div>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={() => deleteNote(note.id)}
        title={t.notes.deleteForever}
        message={t.notes.deleteForeverMessage}
      />
    </>
  );
}

export default memo(NoteCard);
