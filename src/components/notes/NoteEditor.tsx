import { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { Smile } from 'lucide-react';
const MDEditor = lazy(() => import('@uiw/react-md-editor'));
import Modal from '../ui/Modal';
import IconPicker, { ICON_MAP } from '../ui/IconPicker';
import { Note } from '../../types';

interface NoteEditorProps {
  note: Note | null;
  open: boolean;
  onClose: () => void;
  onSave: (data: { title: string; content: string; emoji: string | null }) => Promise<void>;
}

export default function NoteEditor({ note, open, onClose, onSave }: NoteEditorProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [emoji, setEmoji] = useState<string | null>(null);
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [saving, setSaving] = useState(false);
  const iconPickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (note) {
      setTitle(note.title);
      setContent(note.content);
      setEmoji(note.emoji);
    } else {
      setTitle('');
      setContent('');
      setEmoji(null);
    }
  }, [note, open]);

  useEffect(() => {
    if (!showIconPicker) return;
    const handleClick = (e: MouseEvent) => {
      if (iconPickerRef.current && !iconPickerRef.current.contains(e.target as Node)) {
        setShowIconPicker(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showIconPicker]);

  const handleSave = async () => {
    if (!title.trim() && !content.trim()) return;
    setSaving(true);
    await onSave({ title, content, emoji });
    setSaving(false);
    onClose();
  };

  return (
    <Modal open={open} onClose={handleSave}>
      <div className="bg-[#13111c]" data-color-mode="dark">
        <input
          type="text"
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full px-6 pt-6 pb-2 bg-transparent text-white text-[16px] font-semibold placeholder-[#4a4660] outline-none"
        />
        <div className="px-6">
          <Suspense fallback={<div className="h-[300px] flex items-center justify-center text-[#7a7890] text-[13px]">Loading editor...</div>}>
            <MDEditor
              value={content}
              onChange={(val) => setContent(val ?? '')}
              preview="edit"
              hideToolbar={false}
              height={300}
              visibleDragbar={false}
              style={{ backgroundColor: 'transparent', border: 'none' }}
            />
          </Suspense>
        </div>
        <div className="px-5 py-3.5 flex items-center justify-between border-t border-white/[0.04]">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="relative" ref={iconPickerRef}>
              <button
                onClick={() => setShowIconPicker(!showIconPicker)}
                className="p-1.5 rounded-lg hover:bg-white/[0.06] text-[#6b6882] hover:text-[#b0adc0] transition-colors flex items-center gap-1.5"
                title="Pick icon"
              >
                {emoji && ICON_MAP[emoji] ? (() => { const I = ICON_MAP[emoji]; return <I size={16} />; })() : <Smile size={16} />}
              </button>
              {showIconPicker && (
                <div className="absolute bottom-full left-0 mb-1 z-50 bg-[#1e1b2e] border border-[#2d2a40] rounded-xl shadow-xl shadow-black/40">
                  <IconPicker current={emoji} onChange={(e) => { setEmoji(e); setShowIconPicker(false); }} />
                </div>
              )}
            </div>
          </div>
          <div className="flex gap-2.5">
            <button
              onClick={onClose}
              className="px-4 py-2 text-[13px] text-[#7a7890] hover:text-white rounded-lg hover:bg-white/[0.04] transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-5 py-2 text-[13px] bg-[#ec4899] hover:bg-[#db2777] text-white font-medium rounded-full transition-all disabled:opacity-50"
            >
              {saving ? '...' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
