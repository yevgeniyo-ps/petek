import { Note } from '@shared/types';
import { useLabels } from '@shared/context/LabelsContext';
import { useTags } from '@shared/context/TagsContext';
import { truncateMarkdown } from '@shared/lib/utils';
import { Pin, Star } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface NoteCardProps {
  note: Note;
  onClick: () => void;
  overlay?: boolean;
}

export function NoteCard({ note, onClick, overlay }: NoteCardProps) {
  const { getLabelsForNote } = useLabels();
  const { getTagsForNote } = useTags();
  const labels = getLabelsForNote(note.id);
  const tags = getTagsForNote(note.id);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: note.id, disabled: overlay });

  const style = overlay ? undefined : {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0 : undefined,
  };

  const date = new Date(note.updated_at).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });

  return (
    <button
      ref={overlay ? undefined : setNodeRef}
      style={style}
      {...(overlay ? {} : { ...attributes, ...listeners })}
      onClick={overlay ? undefined : onClick}
      className={`w-full text-left p-3 bg-[#13111c] hover:bg-[#1a1726] border border-[#3a3650] rounded-lg transition-colors group ${
        overlay ? 'shadow-xl shadow-black/40 scale-[1.02]' : ''
      }`}
    >
      <div className="flex items-start gap-2">
        {/* Emoji */}
        {note.emoji && (
          <span className="text-base flex-shrink-0 mt-0.5">{note.emoji}</span>
        )}

        <div className="flex-1 min-w-0">
          {/* Title */}
          <div className="flex items-center gap-1.5">
            <h3 className="text-sm font-medium text-white truncate">
              {note.title || 'Untitled'}
            </h3>
            {note.is_pinned && <Pin size={12} className="text-[#7a7890] flex-shrink-0" />}
            {note.is_important && <Star size={12} className="text-pink-400 flex-shrink-0 fill-pink-400" />}
          </div>

          {/* Content preview */}
          {note.content && (
            <div className="text-xs text-[#7a7890] mt-1 line-clamp-2 markdown-prose">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {truncateMarkdown(note.content, 120)}
              </ReactMarkdown>
            </div>
          )}

          {/* Bottom: labels + tags + date */}
          <div className="flex items-center gap-1.5 mt-2">
            {labels.slice(0, 3).map(label => (
              <span
                key={label.id}
                className="px-1.5 py-0.5 bg-white/5 rounded text-[10px] text-[#7a7890]"
              >
                {label.name}
              </span>
            ))}
            {tags.slice(0, 2).map(tag => (
              <span
                key={tag.id}
                className="px-1.5 py-0.5 bg-pink-500/10 rounded text-[10px] text-[#c084a8]"
              >
                {tag.name}
              </span>
            ))}
            <span className="ml-auto text-[10px] text-[#4a4660]">{date}</span>
          </div>
        </div>
      </div>
    </button>
  );
}
