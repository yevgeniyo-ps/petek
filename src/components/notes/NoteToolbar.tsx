import { useState } from 'react';
import { Pin, PinOff, Smile, Trash2, ArchiveRestore, Archive } from 'lucide-react';
import EmojiPicker from '../ui/EmojiPicker';

interface NoteToolbarProps {
  isPinned: boolean;
  isArchived?: boolean;
  onTogglePin: () => void;
  onEmojiChange: (emoji: string | null) => void;
  onArchive?: () => void;
  onRestore?: () => void;
  onDelete?: () => void;
  currentEmoji: string | null;
}

export default function NoteToolbar({
  isPinned, isArchived, onTogglePin, onEmojiChange, onArchive, onRestore, onDelete, currentEmoji,
}: NoteToolbarProps) {
  const [showEmojis, setShowEmojis] = useState(false);

  const btnClass = "p-2 rounded-lg hover:bg-white/[0.06] text-[#6b6882] hover:text-[#b0adc0] transition-colors";

  return (
    <div className="flex items-center gap-1 relative">
      {!isArchived && (
        <>
          <button onClick={onTogglePin} className={btnClass} title={isPinned ? 'Unpin' : 'Pin'}>
            {isPinned ? <PinOff size={16} /> : <Pin size={16} />}
          </button>
          <div className="relative">
            <button onClick={() => setShowEmojis(!showEmojis)} className={btnClass} title="Emoji">
              <Smile size={16} />
            </button>
            {showEmojis && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowEmojis(false)} />
                <div className="absolute bottom-full left-0 mb-2 z-20 bg-[#1e1b2e] border border-[#2d2a40] rounded-xl shadow-xl shadow-black/40">
                  <EmojiPicker current={currentEmoji} onChange={(e) => { onEmojiChange(e); setShowEmojis(false); }} />
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
