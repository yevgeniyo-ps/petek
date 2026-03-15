import { useState, useRef, useEffect } from 'react';
import { Search, Star, Plus } from 'lucide-react';
import { useLabels } from '@shared/context/LabelsContext';
import { useTags } from '@shared/context/TagsContext';

interface SearchBarProps {
  search: string;
  onSearchChange: (value: string) => void;
  filterLabel: string | null;
  onFilterLabelChange: (labelId: string | null) => void;
  filterImportant: boolean;
  onFilterImportantChange: (value: boolean) => void;
  filterTagIds: string[];
  onFilterTagIdsChange: (tagIds: string[]) => void;
}

export function SearchBar({
  search,
  onSearchChange,
  filterLabel,
  onFilterLabelChange,
  filterImportant,
  onFilterImportantChange,
  filterTagIds,
  onFilterTagIdsChange,
}: SearchBarProps) {
  const { labels, createLabel } = useLabels();
  const { getTagsForLabel, createTag } = useTags();
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [addingTag, setAddingTag] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const tagInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (adding) inputRef.current?.focus();
  }, [adding]);

  useEffect(() => {
    if (addingTag) tagInputRef.current?.focus();
  }, [addingTag]);

  const handleCreate = async () => {
    const name = newName.trim();
    if (name) await createLabel(name);
    setNewName('');
    setAdding(false);
  };

  const handleCreateTag = async () => {
    const name = newTagName.trim();
    if (name && filterLabel) await createTag(filterLabel, name);
    setNewTagName('');
    setAddingTag(false);
  };

  const toggleTag = (tagId: string) => {
    onFilterTagIdsChange(
      filterTagIds.includes(tagId)
        ? filterTagIds.filter(id => id !== tagId)
        : [...filterTagIds, tagId]
    );
  };

  const tagsForLabel = filterLabel ? getTagsForLabel(filterLabel) : [];

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

        <button
          onClick={() => onFilterLabelChange(filterLabel === '__uncategorized' ? null : '__uncategorized')}
          className={`px-2 py-1 rounded-md text-xs whitespace-nowrap transition-colors ${
            filterLabel === '__uncategorized'
              ? 'bg-pink-500/20 text-pink-400'
              : 'text-[#7a7890] hover:bg-white/5'
          }`}
        >
          Uncategorized
        </button>

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

      {/* Tag sub-filters */}
      {filterLabel && filterLabel !== '__uncategorized' && tagsForLabel.length > 0 && (
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
          {tagsForLabel.map(tag => (
            <button
              key={tag.id}
              onClick={() => toggleTag(tag.id)}
              className={`px-2 py-0.5 rounded text-[10px] whitespace-nowrap transition-colors ${
                filterTagIds.includes(tag.id)
                  ? 'bg-pink-500/15 text-pink-400'
                  : 'text-[#6b6882] bg-white/[0.03] hover:bg-white/[0.06]'
              }`}
            >
              {tag.name}
            </button>
          ))}
          {addingTag ? (
            <input
              ref={tagInputRef}
              type="text"
              value={newTagName}
              onChange={e => setNewTagName(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') handleCreateTag();
                if (e.key === 'Escape') { setAddingTag(false); setNewTagName(''); }
              }}
              onBlur={handleCreateTag}
              placeholder="Tag..."
              className="px-2 py-0.5 bg-transparent border border-[#2d2a40] rounded text-[10px] text-white placeholder-[#4a4660] outline-none focus:border-pink-500/50 w-16"
            />
          ) : (
            <button
              onClick={() => setAddingTag(true)}
              className="flex items-center px-1 py-0.5 rounded text-[10px] text-[#4a4660] hover:text-pink-400 hover:bg-white/5 transition-colors"
              title="Add tag"
            >
              <Plus size={10} />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
