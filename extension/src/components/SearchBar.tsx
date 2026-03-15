import { useState, useRef, useEffect } from 'react';
import { Search, Star, Plus } from 'lucide-react';
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
  const { labels, createLabel } = useLabels();
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (adding) inputRef.current?.focus();
  }, [adding]);

  const handleCreate = async () => {
    const name = newName.trim();
    if (name) await createLabel(name);
    setNewName('');
    setAdding(false);
  };

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
          <Star size={12} className={filterImportant ? 'fill-pink-400' : ''} />
          Starred
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

        {adding ? (
          <input
            ref={inputRef}
            type="text"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') handleCreate();
              if (e.key === 'Escape') { setAdding(false); setNewName(''); }
            }}
            onBlur={handleCreate}
            placeholder="Label name..."
            className="px-2 py-1 bg-transparent border border-[#2d2a40] rounded-md text-xs text-white placeholder-[#4a4660] outline-none focus:border-pink-500/50 w-24"
          />
        ) : (
          <button
            onClick={() => setAdding(true)}
            className="flex items-center gap-0.5 px-1.5 py-1 rounded-md text-xs text-[#4a4660] hover:text-pink-400 hover:bg-white/5 transition-colors whitespace-nowrap"
            title="Add label"
          >
            <Plus size={12} />
          </button>
        )}
      </div>
    </div>
  );
}
