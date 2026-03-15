import { Note } from '@shared/types';
import { useLabels } from '@shared/context/LabelsContext';
import { Pin, Star } from 'lucide-react';

interface NoteCardProps {
  note: Note;
  onClick: () => void;
}

export function NoteCard({ note, onClick }: NoteCardProps) {
  const { getLabelsForNote } = useLabels();
  const labels = getLabelsForNote(note.id);

  const date = new Date(note.updated_at).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });

  return (
    <button
      onClick={onClick}
      className="w-full text-left p-3 bg-[#13111c] hover:bg-[#1a1726] border border-[#1c1928] rounded-lg transition-colors group"
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
            <p className="text-xs text-[#7a7890] mt-1 line-clamp-2">
              {note.content.replace(/[#*`>\-\[\]]/g, '').slice(0, 120)}
            </p>
          )}

          {/* Bottom: labels + date */}
          <div className="flex items-center gap-1.5 mt-2">
            {labels.slice(0, 3).map(label => (
              <span
                key={label.id}
                className="px-1.5 py-0.5 bg-white/5 rounded text-[10px] text-[#7a7890]"
              >
                {label.name}
              </span>
            ))}
            <span className="ml-auto text-[10px] text-[#4a4660]">{date}</span>
          </div>
        </div>
      </div>
    </button>
  );
}
