import { useState } from 'react';
import { Pin, PinOff, Smile, Trash2, ArchiveRestore, Archive, AlertTriangle } from 'lucide-react';
import IconPicker, { ICON_MAP } from '../ui/IconPicker';

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
}

export default function NoteToolbar({
  isPinned, isImportant, isArchived, onTogglePin, onToggleImportant, onEmojiChange, onArchive, onRestore, onDelete, currentEmoji,
}: NoteToolbarProps) {
  const [showIcons, setShowIcons] = useState(false);

  const btnClass = "p-2 rounded-lg hover:bg-white/[0.06] text-[#6b6882] hover:text-[#b0adc0] transition-colors";

  const CurrentIcon = currentEmoji && ICON_MAP[currentEmoji] ? ICON_MAP[currentEmoji] : null;

  return (
    <div className="flex items-center gap-1 relative">
      {!isArchived && (
        <>
          <button onClick={onTogglePin} className={btnClass} title={isPinned ? 'Unpin' : 'Pin'}>
            {isPinned ? <PinOff size={16} /> : <Pin size={16} />}
          </button>
          <button onClick={onToggleImportant} className={`p-2 rounded-lg transition-colors ${isImportant ? 'text-[#f59e0b] hover:bg-white/[0.06]' : btnClass}`} title={isImportant ? 'Remove important' : 'Mark important'}>
            <AlertTriangle size={16} />
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
