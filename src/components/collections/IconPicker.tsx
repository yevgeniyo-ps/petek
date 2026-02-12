import { COLLECTION_ICONS } from '../../lib/icons';

interface IconPickerProps {
  current: string;
  onChange: (icon: string) => void;
}

export default function IconPicker({ current, onChange }: IconPickerProps) {
  return (
    <div className="grid grid-cols-6 gap-2 p-3">
      {Object.entries(COLLECTION_ICONS).map(([key, Icon]) => (
        <button
          key={key}
          onClick={() => onChange(key)}
          title={key}
          className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all hover:scale-110 ${
            current === key
              ? 'border-2 border-[#ec4899] bg-[#ec4899]/10 text-[#ec4899]'
              : 'border border-[#1c1928] text-[#7a7890] hover:text-white hover:border-[#2d2a40]'
          }`}
        >
          <Icon size={18} />
        </button>
      ))}
    </div>
  );
}
