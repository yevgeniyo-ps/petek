import { useState, useEffect, useRef, useCallback } from 'react';
import { Smile, ChevronDown, Star } from 'lucide-react';
import Modal from '../ui/Modal';
import IconPicker, { ICON_MAP } from '../ui/IconPicker';
import { Note } from '../../types';
import { useLabels } from '../../context/LabelsContext';
import { useTags } from '../../context/TagsContext';

interface NoteEditorProps {
  note: Note | null;
  open: boolean;
  onClose: () => void;
  onSave: (data: { title: string; content: string; emoji: string | null; labelId: string | null; isImportant: boolean }) => Promise<void>;
}

export default function NoteEditor({ note, open, onClose, onSave }: NoteEditorProps) {
  const { labels, getLabelsForNote } = useLabels();
  const { getTagsForLabel, getTagsForNote, addTagToNote, removeTagFromNote } = useTags();
  const [isStarred, setIsStarred] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [emoji, setEmoji] = useState<string | null>(null);
  const [selectedLabelId, setSelectedLabelId] = useState<string | null>(null);
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [saving, setSaving] = useState(false);
  const iconPickerRef = useRef<HTMLDivElement>(null);
  const categoryPickerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const autoResize = useCallback(() => {
    const ta = textareaRef.current;
    if (ta) {
      ta.style.height = 'auto';
      ta.style.height = Math.max(ta.scrollHeight, 200) + 'px';
    }
  }, []);

  useEffect(() => {
    if (note) {
      setTitle(note.title);
      setContent(note.content);
      setEmoji(note.emoji);
      setIsStarred(note.is_important);
      const noteLabels = getLabelsForNote(note.id);
      setSelectedLabelId(noteLabels[0]?.id ?? null);
    } else {
      setTitle('');
      setContent('');
      setEmoji(null);
      setIsStarred(false);
      setSelectedLabelId(null);
    }
  }, [note, open, getLabelsForNote]);

  useEffect(() => {
    if (open) {
      requestAnimationFrame(autoResize);
    }
  }, [open, autoResize]);

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

  useEffect(() => {
    if (!showCategoryPicker) return;
    const handleClick = (e: MouseEvent) => {
      if (categoryPickerRef.current && !categoryPickerRef.current.contains(e.target as Node)) {
        setShowCategoryPicker(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showCategoryPicker]);

  const handleSave = async () => {
    if (!title.trim() && !content.trim()) return;
    setSaving(true);
    await onSave({ title, content, emoji, labelId: selectedLabelId, isImportant: isStarred });
    setSaving(false);
    onClose();
  };

  const selectedLabel = labels.find(l => l.id === selectedLabelId);

  return (
    <Modal open={open} onClose={handleSave}>
      <div className="bg-[#13111c]">
        <input
          type="text"
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full px-6 pt-6 pb-2 bg-transparent text-white text-[16px] font-semibold placeholder-[#4a4660] outline-none"
        />
        {selectedLabelId && note && (() => {
          const availableTags = getTagsForLabel(selectedLabelId);
          if (availableTags.length === 0) return null;
          const noteTagSet = new Set(getTagsForNote(note.id).map(t => t.id));
          return (
            <div className="px-6 pb-2 flex items-center gap-1.5 flex-wrap">
              {availableTags.map(tag => {
                const active = noteTagSet.has(tag.id);
                return (
                  <button
                    key={tag.id}
                    onClick={() => active ? removeTagFromNote(note.id, tag.id) : addTagToNote(note.id, tag.id)}
                    className={`px-2 py-0.5 rounded text-[11px] font-medium transition-all ${
                      active
                        ? 'bg-[#ec4899]/15 text-[#f472b6]'
                        : 'bg-white/[0.03] text-[#6b6882] hover:text-[#9896a8] hover:bg-white/[0.06]'
                    }`}
                  >
                    {tag.name}
                  </button>
                );
              })}
            </div>
          );
        })()}
        <div className="px-6 pb-4">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => { setContent(e.target.value); autoResize(); }}
            placeholder="Write your note... (supports markdown)"
            className="w-full bg-transparent text-[14px] text-[#e0dfe4] placeholder-[#4a4660] outline-none resize-none leading-relaxed font-mono"
            style={{ minHeight: 200 }}
            onKeyDown={(e) => {
              if (e.key === 'Tab') {
                e.preventDefault();
                const start = e.currentTarget.selectionStart;
                const end = e.currentTarget.selectionEnd;
                setContent(content.slice(0, start) + '  ' + content.slice(end));
                requestAnimationFrame(() => {
                  e.currentTarget.selectionStart = e.currentTarget.selectionEnd = start + 2;
                });
              }
            }}
          />
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
            <button
              onClick={() => setIsStarred(!isStarred)}
              className={`p-1.5 rounded-lg transition-colors ${
                isStarred ? 'text-[#ec4899] hover:bg-white/[0.06]' : 'hover:bg-white/[0.06] text-[#6b6882] hover:text-[#b0adc0]'
              }`}
              title={isStarred ? 'Unstar' : 'Star'}
            >
              <Star size={16} className={isStarred ? 'fill-[#ec4899]' : ''} />
            </button>
            {labels.length > 0 && (
              <div className="relative" ref={categoryPickerRef}>
                <button
                  onClick={() => setShowCategoryPicker(!showCategoryPicker)}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[12px] transition-colors ${
                    selectedLabel
                      ? 'bg-[#ec4899]/15 text-[#f472b6]'
                      : 'text-[#6b6882] hover:text-[#b0adc0] hover:bg-white/[0.06]'
                  }`}
                >
                  <span>{selectedLabel?.name ?? 'Category'}</span>
                  <ChevronDown size={12} />
                </button>
                {showCategoryPicker && (
                  <div className="absolute bottom-full left-0 mb-1 w-44 bg-[#1e1b2e] border border-[#3a3650] rounded-lg shadow-xl py-1 z-50">
                    <button
                      onClick={() => { setSelectedLabelId(null); setShowCategoryPicker(false); }}
                      className={`w-full text-left px-3 py-1.5 text-[12px] hover:bg-white/[0.08] transition-colors ${
                        !selectedLabelId ? 'text-[#f472b6]' : 'text-[#c0bfd0]'
                      }`}
                    >
                      Uncategorized
                    </button>
                    {labels.map(label => (
                      <button
                        key={label.id}
                        onClick={() => { setSelectedLabelId(label.id); setShowCategoryPicker(false); }}
                        className={`w-full text-left px-3 py-1.5 text-[12px] hover:bg-white/[0.08] transition-colors flex items-center gap-2 ${
                          selectedLabelId === label.id ? 'text-[#f472b6]' : 'text-[#c0bfd0]'
                        }`}
                      >
                        <span className="truncate">{label.name}</span>
                        {selectedLabelId === label.id && <span className="ml-auto text-[10px]">&#10003;</span>}
                      </button>
                    ))}
                  </div>
                )}
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
