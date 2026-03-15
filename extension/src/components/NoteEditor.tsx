import { useState, useEffect } from 'react';
import { Note } from '@shared/types';
import { useNotes } from '@shared/context/NotesContext';
import { useLabels } from '@shared/context/LabelsContext';
import { useTags } from '@shared/context/TagsContext';
import { NoteToolbar } from './NoteToolbar';
import { X, Tag, SmilePlus } from 'lucide-react';
import MDEditor from '@uiw/react-md-editor';

interface NoteEditorProps {
  note: Note | null; // null = creating new
  onClose: () => void;
}

const EMOJI_OPTIONS = ['📝', '💡', '🔥', '⭐', '🎯', '📌', '🚀', '💻', '📚', '🎨', '🔧', '✅', '❤️', '🏠', '💰', '🎵'];

export function NoteEditor({ note: initialNote, onClose }: NoteEditorProps) {
  const { notes, createNote, updateNote } = useNotes();
  const { labels, getLabelsForNote, addLabelToNote, removeLabelFromNote } = useLabels();
  const { getTagsForLabel, getTagsForNote, addTagToNote, removeTagFromNote } = useTags();

  // Get live note from context so toolbar actions (star, pin) reflect immediately
  const note = initialNote ? notes.find(n => n.id === initialNote.id) ?? initialNote : null;

  const [title, setTitle] = useState(note?.title ?? '');
  const [content, setContent] = useState(note?.content ?? '');
  const [emoji, setEmoji] = useState<string | null>(note?.emoji ?? null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showLabelPicker, setShowLabelPicker] = useState(false);
  const [saving, setSaving] = useState(false);

  const noteLabels = note ? getLabelsForNote(note.id) : [];
  const noteLabelIds = new Set(noteLabels.map(l => l.id));

  // Auto-save on close for existing notes
  useEffect(() => {
    return () => {
      // Cleanup
    };
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      if (note) {
        await updateNote(note.id, { title, content, emoji });
      } else {
        await createNote({ title, content, emoji });
      }
      onClose();
    } catch {
      // Error handling
    } finally {
      setSaving(false);
    }
  };

  const toggleLabel = async (labelId: string) => {
    if (!note) return;
    if (noteLabelIds.has(labelId)) {
      await removeLabelFromNote(note.id, labelId);
    } else {
      await addLabelToNote(note.id, labelId);
    }
  };

  return (
    <div className="fixed inset-0 bg-[#0c0a12] z-50 flex flex-col animate-slide-up">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#1c1928]">
        <button
          onClick={onClose}
          className="p-1.5 rounded-md text-[#7a7890] hover:text-white hover:bg-white/5 transition-colors"
        >
          <X size={18} />
        </button>

        <div className="flex items-center gap-2">
          {note && <NoteToolbar note={note} onClose={onClose} />}
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-3 py-1.5 bg-pink-500 hover:bg-pink-600 text-white text-xs font-medium rounded-md transition-colors disabled:opacity-50"
          >
            {saving ? '...' : 'Save'}
          </button>
        </div>
      </div>

      {/* Editor body */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 flex flex-col">
        {/* Emoji + Title row */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <button
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="w-9 h-9 flex items-center justify-center rounded-lg bg-[#13111c] border border-[#1c1928] hover:border-[#2a2740] transition-colors text-base"
            >
              {emoji || <SmilePlus size={16} className="text-[#4a4660]" />}
            </button>
            {showEmojiPicker && (
              <div className="absolute top-11 left-0 bg-[#13111c] border border-[#1c1928] rounded-lg p-2 grid grid-cols-8 gap-1 z-10 shadow-xl">
                {EMOJI_OPTIONS.map(e => (
                  <button
                    key={e}
                    onClick={() => { setEmoji(emoji === e ? null : e); setShowEmojiPicker(false); }}
                    className="w-7 h-7 flex items-center justify-center rounded hover:bg-white/10 text-sm"
                  >
                    {e}
                  </button>
                ))}
              </div>
            )}
          </div>

          <input
            type="text"
            placeholder="Title"
            value={title}
            onChange={e => setTitle(e.target.value)}
            className="flex-1 bg-transparent text-white text-lg font-medium placeholder-[#4a4660] focus:outline-none"
            autoFocus
          />
        </div>

        {/* Label chips */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {noteLabels.map(label => (
            <span key={label.id} className="px-2 py-0.5 bg-pink-500/15 text-pink-400 rounded text-xs">
              {label.name}
            </span>
          ))}
          <div className="relative">
            <button
              onClick={() => setShowLabelPicker(!showLabelPicker)}
              className="p-1 rounded text-[#7a7890] hover:text-white hover:bg-white/5 transition-colors"
              title="Manage labels"
            >
              <Tag size={14} />
            </button>
            {showLabelPicker && (
              <div className="absolute top-8 left-0 bg-[#13111c] border border-[#1c1928] rounded-lg p-2 min-w-[160px] z-10 shadow-xl">
                {labels.length === 0 ? (
                  <p className="text-xs text-[#4a4660] px-2 py-1">No labels</p>
                ) : (
                  labels.map(label => (
                    <button
                      key={label.id}
                      onClick={() => toggleLabel(label.id)}
                      disabled={!note}
                      className={`w-full text-left px-2 py-1.5 rounded text-xs transition-colors ${
                        noteLabelIds.has(label.id)
                          ? 'text-pink-400 bg-pink-500/10'
                          : 'text-[#7a7890] hover:bg-white/5'
                      }`}
                    >
                      {label.name}
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        {/* Tag chips for the note's category */}
        {note && noteLabels.length > 0 && (() => {
          const labelId = noteLabels[0].id;
          const availableTags = getTagsForLabel(labelId);
          if (availableTags.length === 0) return null;
          const noteTagSet = new Set(getTagsForNote(note.id).map(t => t.id));
          return (
            <div className="flex items-center gap-1 flex-wrap">
              {availableTags.map(tag => {
                const active = noteTagSet.has(tag.id);
                return (
                  <button
                    key={tag.id}
                    onClick={() => active ? removeTagFromNote(note.id, tag.id) : addTagToNote(note.id, tag.id)}
                    className={`px-2 py-0.5 rounded text-[10px] transition-colors ${
                      active
                        ? 'bg-pink-500/15 text-pink-400'
                        : 'bg-white/[0.03] text-[#6b6882] hover:bg-white/[0.06]'
                    }`}
                  >
                    {tag.name}
                  </button>
                );
              })}
            </div>
          );
        })()}

        {/* Markdown editor */}
        <div data-color-mode="dark" className="flex-1 min-h-0">
          <MDEditor
            value={content}
            onChange={val => setContent(val ?? '')}
            preview="edit"
            height="100%"
            visibleDragbar={false}
          />
        </div>
      </div>

      <style>{`
        @keyframes slide-up {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        .animate-slide-up {
          animation: slide-up 0.2s ease-out;
        }
      `}</style>
    </div>
  );
}
