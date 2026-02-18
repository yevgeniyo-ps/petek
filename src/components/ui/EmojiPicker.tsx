import { X } from 'lucide-react';

const EMOJIS = [
  '😀', '😂', '🥰', '😎', '🤔', '😴',
  '🔥', '⭐', '❤️', '💡', '🎯', '🚀',
  '✅', '⚠️', '📌', '📝', '📅', '🔑',
  '💼', '🎓', '🏠', '🛒', '💰', '🎵',
  '🌱', '🍕', '☕', '🏋️', '🧘', '✈️',
  '📚', '💻', '🎨', '🔧', '📊', '🎉',
];

interface EmojiPickerProps {
  current: string | null;
  onChange: (emoji: string | null) => void;
}

export default function EmojiPicker({ current, onChange }: EmojiPickerProps) {
  return (
    <div className="p-3 max-w-[260px]">
      <div className="flex flex-wrap gap-1">
        {current && (
          <button
            onClick={() => onChange(null)}
            title="Remove emoji"
            className="w-8 h-8 rounded-lg flex items-center justify-center text-[#6b6882] hover:bg-white/[0.08] hover:text-[#b0adc0] transition-colors"
          >
            <X size={14} />
          </button>
        )}
        {EMOJIS.map((emoji) => (
          <button
            key={emoji}
            onClick={() => onChange(emoji)}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-[16px] hover:bg-white/[0.08] transition-colors"
            style={{
              boxShadow: current === emoji ? '0 0 0 2px #ec4899' : 'none',
              borderRadius: '8px',
            }}
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
}
