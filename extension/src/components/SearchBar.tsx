import { Search, Star } from 'lucide-react';
import { useLabels } from '@shared/context/LabelsContext';

interface SearchBarProps {
  search: string;
  onSearchChange: (value: string) => void;
  filterLabel: string | null;
  onFilterLabelChange: (labelId: string | null) => void;
  filterImportant: boolean;
  onFilterImportantChange: (value: boolean) => void;
}

export function SearchBar({
  search,
  onSearchChange,
  filterLabel,
  onFilterLabelChange,
  filterImportant,
  onFilterImportantChange,
}: SearchBarProps) {
  const { labels } = useLabels();

  return (
    <div className="flex-shrink-0 px-4 py-3 space-y-2 border-b border-[#1c1928]">
      {/* Search input */}
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#4a4660]" />
        <input
          type="text"
          placeholder="Search notes..."
          value={search}
          onChange={e => onSearchChange(e.target.value)}
          className="w-full pl-8 pr-3 py-2 bg-[#13111c] border border-[#1c1928] rounded-lg text-white placeholder-[#4a4660] text-sm focus:outline-none focus:border-pink-500/50"
        />
      </div>

      {/* Filters */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
        <button
          onClick={() => onFilterImportantChange(!filterImportant)}
          className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs whitespace-nowrap transition-colors ${
            filterImportant
              ? 'bg-pink-500/20 text-pink-400'
              : 'text-[#7a7890] hover:bg-white/5'
          }`}
        >
          <Star size={12} />
          Important
        </button>

        {labels.map(label => (
          <button
            key={label.id}
            onClick={() => onFilterLabelChange(filterLabel === label.id ? null : label.id)}
            className={`px-2 py-1 rounded-md text-xs whitespace-nowrap transition-colors ${
              filterLabel === label.id
                ? 'bg-pink-500/20 text-pink-400'
                : 'text-[#7a7890] hover:bg-white/5'
            }`}
          >
            {label.name}
          </button>
        ))}
      </div>
    </div>
  );
}
