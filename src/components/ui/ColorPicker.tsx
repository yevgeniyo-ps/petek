import { NOTE_COLORS } from '../../lib/utils';
import { NoteColor } from '../../types';

interface ColorPickerProps {
  current: string;
  onChange: (color: NoteColor) => void;
}

export default function ColorPicker({ current, onChange }: ColorPickerProps) {
  return (
    <div className="flex gap-2.5 p-3">
      {(Object.entries(NOTE_COLORS) as [NoteColor, typeof NOTE_COLORS[NoteColor]][]).map(([key, config]) => (
        <button
          key={key}
          onClick={() => onChange(key)}
          title={config.name}
          className="w-7 h-7 rounded-full border-2 transition-all hover:scale-110"
          style={{
            backgroundColor: config.bg,
            borderColor: current === key ? '#ec4899' : config.border,
            boxShadow: current === key ? '0 0 0 1px #ec4899' : 'none',
          }}
        />
      ))}
    </div>
  );
}
