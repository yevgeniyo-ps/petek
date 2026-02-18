import { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { Tag, X, ChevronDown, Smile } from 'lucide-react';
const MDEditor = lazy(() => import('@uiw/react-md-editor'));
import Modal from '../ui/Modal';
import EmojiPicker from '../ui/EmojiPicker';
import { Note, Label } from '../../types';
import { useLabels } from '../../context/LabelsContext';

interface NoteEditorProps {
  note: Note | null;
  open: boolean;
  onClose: () => void;
  onSave: (data: { title: string; content: string; emoji: string | null }) => Promise<void>;
}

export default function NoteEditor({ note, open, onClose, onSave }: NoteEditorProps) {
  const { labels, getLabelsForNote, addLabelToNote, removeLabelFromNote } = useLabels();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [emoji, setEmoji] = useState<string | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [saving, setSaving] = useState(false);
  const [tagPickerOpen, setTagPickerOpen] = useState(false);
  const [assignedLabels, setAssignedLabels] = useState<Label[]>([]);
  const tagPickerRef = useRef<HTMLDivElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (note) {
      setTitle(note.title);
      setContent(note.content);
      setEmoji(note.emoji);
      setAssignedLabels(getLabelsForNote(note.id));
    } else {
      setTitle('');
      setContent('');
      setEmoji(null);
      setAssignedLabels([]);
    }
  }, [note, open, getLabelsForNote]);

  useEffect(() => {
    if (!tagPickerOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (tagPickerRef.current && !tagPickerRef.current.contains(e.target as Node)) {
        setTagPickerOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [tagPickerOpen]);

  useEffect(() => {
    if (!showEmojiPicker) return;
    const handleClick = (e: MouseEvent) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(e.target as Node)) {
        setShowEmojiPicker(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showEmojiPicker]);

  const handleToggleLabel = async (label: Label) => {
    if (!note) return;
    const isAssigned = assignedLabels.some(l => l.id === label.id);
    if (isAssigned) {
      await removeLabelFromNote(note.id, label.id);
      setAssignedLabels(prev => prev.filter(l => l.id !== label.id));
    } else {
      await addLabelToNote(note.id, label.id);
      setAssignedLabels(prev => [...prev, label]);
    }
  };

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
            <div className="relative" ref={emojiPickerRef}>
              <button
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="p-1.5 rounded-lg hover:bg-white/[0.06] text-[#6b6882] hover:text-[#b0adc0] transition-colors flex items-center gap-1.5"
                title="Pick emoji"
              >
                {emoji ? (
                  <span className="text-[16px]">{emoji}</span>
                ) : (
                  <Smile size={16} />
                )}
              </button>
              {showEmojiPicker && (
                <div className="absolute bottom-full left-0 mb-1 z-50 bg-[#1e1b2e] border border-[#2d2a40] rounded-xl shadow-xl shadow-black/40">
                  <EmojiPicker current={emoji} onChange={(e) => { setEmoji(e); setShowEmojiPicker(false); }} />
                </div>
              )}
            </div>
            {note && (
              <div className="flex items-center gap-1.5 flex-wrap" ref={tagPickerRef}>
                {assignedLabels.map(label => (
                  <span
                    key={label.id}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#ec4899]/25 text-[#f472b6] text-[11px] font-medium"
                  >
                    {label.name}
                    <X
                      size={10}
                      className="cursor-pointer hover:text-white transition-colors"
                      onClick={() => handleToggleLabel(label)}
                    />
                  </span>
                ))}
                <div className="relative">
                  <button
                    onClick={() => setTagPickerOpen(!tagPickerOpen)}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] text-[#7a7890] hover:text-[#b0adc0] hover:bg-white/[0.06] transition-colors"
                  >
                    <Tag size={10} />
                    <ChevronDown size={10} />
                  </button>
                  {tagPickerOpen && labels.length > 0 && (
                    <div className="absolute bottom-full left-0 mb-1 w-40 bg-[#1e1b2e] border border-[#3a3650] rounded-lg shadow-xl py-1 z-50">
                      {labels.map(label => {
                        const isAssigned = assignedLabels.some(l => l.id === label.id);
                        return (
                          <button
                            key={label.id}
                            onClick={() => handleToggleLabel(label)}
                            className={`w-full text-left px-3 py-1.5 text-[12px] hover:bg-white/[0.08] transition-colors flex items-center gap-2 ${
                              isAssigned ? 'text-[#f472b6]' : 'text-[#c0bfd0]'
                            }`}
                          >
                            <Tag size={11} />
                            <span className="truncate">{label.name}</span>
                            {isAssigned && <span className="ml-auto text-[10px]">&#10003;</span>}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}
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
