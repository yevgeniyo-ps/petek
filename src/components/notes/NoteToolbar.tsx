import { useState } from 'react';
import { Pin, PinOff, Smile, Trash2, ArchiveRestore, Archive, Star, Tag } from 'lucide-react';
import IconPicker, { ICON_MAP } from '../ui/IconPicker';
import { Label } from '../../types';

interface NoteToolbarProps {
  isPinned: boolean;
  isImportant: boolean;
  isArchived?: boolean;
  onTogglePin: () => void;
  onToggleImportant: () => void;
  onEmojiChange: (emoji: string | null) => void;
  onArchive?: () => void;
  onRestore?: () => void;
  onDelete?: () => void;
  currentEmoji: string | null;
  labels?: Label[];
  currentLabelId?: string | null;
  onLabelChange?: (labelId: string | null) => void;
}

export default function NoteToolbar({
  isPinned, isImportant, isArchived, onTogglePin, onToggleImportant, onEmojiChange, onArchive, onRestore, onDelete, currentEmoji,
  labels, currentLabelId, onLabelChange,
}: NoteToolbarProps) {
  const [showIcons, setShowIcons] = useState(false);
  const [showLabels, setShowLabels] = useState(false);

  const btnClass = "p-2 rounded-lg hover:bg-white/[0.06] text-[#6b6882] hover:text-[#b0adc0] transition-colors";

  const CurrentIcon = currentEmoji && ICON_MAP[currentEmoji] ? ICON_MAP[currentEmoji] : null;

  return (
    <div className="flex items-center gap-1 relative">
      {!isArchived && (
        <>
          <button onClick={onTogglePin} className={btnClass} title={isPinned ? 'Unpin' : 'Pin'}>
            {isPinned ? <PinOff size={16} /> : <Pin size={16} />}
          </button>
          <button onClick={onToggleImportant} className={`p-2 rounded-lg transition-colors ${isImportant ? 'text-[#ec4899] hover:bg-white/[0.06]' : btnClass}`} title={isImportant ? 'Unstar' : 'Star'}>
            <Star size={16} className={isImportant ? 'fill-[#ec4899]' : ''} />
          </button>
          <div className="relative">
            <button onClick={() => setShowIcons(!showIcons)} className={btnClass} title="Icon">
              {CurrentIcon ? <CurrentIcon size={16} /> : <Smile size={16} />}
            </button>
            {showIcons && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowIcons(false)} />
                <div className="absolute bottom-full left-0 mb-2 z-20 bg-[#1e1b2e] border border-[#2d2a40] rounded-xl shadow-xl shadow-black/40">
                  <IconPicker current={currentEmoji} onChange={(e) => { onEmojiChange(e); setShowIcons(false); }} />
                </div>
              </>
            )}
          </div>
          {labels && onLabelChange && (
            <div className="relative">
              <button onClick={() => setShowLabels(!showLabels)} className={`p-2 rounded-lg transition-colors ${currentLabelId ? 'text-[#f472b6] hover:bg-white/[0.06]' : btnClass}`} title="Category">
                <Tag size={16} />
              </button>
              {showLabels && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowLabels(false)} />
                  <div className="absolute bottom-full left-0 mb-2 w-40 bg-[#1e1b2e] border border-[#3a3650] rounded-lg shadow-xl py-1 z-20">
                    <button
                      onClick={() => { onLabelChange(null); setShowLabels(false); }}
                      className={`w-full text-left px-3 py-1.5 text-[12px] hover:bg-white/[0.08] transition-colors ${
                        !currentLabelId ? 'text-[#f472b6]' : 'text-[#c0bfd0]'
                      }`}
                    >
                      Uncategorized
                    </button>
                    {labels.map(l => (
                      <button
                        key={l.id}
                        onClick={() => { onLabelChange(l.id); setShowLabels(false); }}
                        className={`w-full text-left px-3 py-1.5 text-[12px] hover:bg-white/[0.08] transition-colors flex items-center gap-2 ${
                          currentLabelId === l.id ? 'text-[#f472b6]' : 'text-[#c0bfd0]'
                        }`}
                      >
                        <span className="truncate">{l.name}</span>
                        {currentLabelId === l.id && <span className="ml-auto text-[10px]">&#10003;</span>}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
          {onArchive && (
            <button onClick={onArchive} className={btnClass} title="Archive">
              <Archive size={16} />
            </button>
          )}
        </>
      )}
      {isArchived && (
        <>
          {onRestore && (
            <button onClick={onRestore} className={btnClass} title="Restore">
              <ArchiveRestore size={16} />
            </button>
          )}
          {onDelete && (
            <button onClick={onDelete} className="p-2 rounded-lg hover:bg-white/[0.06] text-[#6b6882] hover:text-[#f87171] transition-colors" title="Delete permanently">
              <Trash2 size={16} />
            </button>
          )}
        </>
      )}
    </div>
  );
}
