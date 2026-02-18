import { useState } from 'react';
import { Pin, PinOff, Palette, Trash2, ArchiveRestore, Archive } from 'lucide-react';
import ColorPicker from '../ui/ColorPicker';
import { NoteColor } from '../../types';

interface NoteToolbarProps {
  isPinned: boolean;
  isArchived?: boolean;
  onTogglePin: () => void;
  onColorChange: (color: NoteColor) => void;
  onArchive?: () => void;
  onRestore?: () => void;
  onDelete?: () => void;
  currentColor: string;
}

export default function NoteToolbar({
  isPinned, isArchived, onTogglePin, onColorChange, onArchive, onRestore, onDelete, currentColor,
}: NoteToolbarProps) {
  const [showColors, setShowColors] = useState(false);

  const btnClass = "p-2 rounded-lg hover:bg-white/[0.06] text-[#6b6882] hover:text-[#b0adc0] transition-colors";

  return (
    <div className="flex items-center gap-1 relative">
      {!isArchived && (
        <>
          <button onClick={onTogglePin} className={btnClass} title={isPinned ? 'Unpin' : 'Pin'}>
            {isPinned ? <PinOff size={16} /> : <Pin size={16} />}
          </button>
          <div className="relative">
            <button onClick={() => setShowColors(!showColors)} className={btnClass} title="Color">
              <Palette size={16} />
            </button>
            {showColors && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowColors(false)} />
                <div className="absolute bottom-full left-0 mb-2 z-20 bg-[#1e1b2e] border border-[#2d2a40] rounded-xl shadow-xl shadow-black/40">
                  <ColorPicker current={currentColor} onChange={(c) => { onColorChange(c); setShowColors(false); }} />
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
