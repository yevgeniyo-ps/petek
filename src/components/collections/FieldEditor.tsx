import { useState } from 'react';
import { Trash2, ChevronUp, ChevronDown, X, Plus } from 'lucide-react';
import { CollectionField, FieldType } from '../../types';

interface FieldEditorProps {
  field: CollectionField;
  isFirst: boolean;
  isLast: boolean;
  onUpdate: (updates: Partial<Pick<CollectionField, 'name' | 'field_type' | 'options' | 'position' | 'is_required'>>) => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}

const FIELD_TYPES: { value: FieldType; label: string }[] = [
  { value: 'text', label: 'Text' },
  { value: 'number', label: 'Number' },
  { value: 'date', label: 'Date' },
  { value: 'select', label: 'Select' },
  { value: 'checkbox', label: 'Checkbox' },
  { value: 'url', label: 'URL' },
];

export default function FieldEditor({ field, isFirst, isLast, onUpdate, onDelete, onMoveUp, onMoveDown }: FieldEditorProps) {
  const [newChoice, setNewChoice] = useState('');
  const choices = field.options?.choices ?? [];

  const addChoice = () => {
    const v = newChoice.trim();
    if (!v || choices.includes(v)) return;
    onUpdate({ options: { ...field.options, choices: [...choices, v] } });
    setNewChoice('');
  };

  const removeChoice = (choice: string) => {
    onUpdate({ options: { ...field.options, choices: choices.filter(c => c !== choice) } });
  };

  return (
    <div className="flex flex-col gap-2 p-3 rounded-lg border border-[#1c1928] bg-[#0f0d18]">
      <div className="flex items-center gap-2">
        {/* Name */}
        <input
          type="text"
          value={field.name}
          onChange={e => onUpdate({ name: e.target.value })}
          placeholder="Field name"
          className="flex-1 bg-transparent border border-[#1c1928] rounded-lg px-3 py-1.5 text-[13px] text-white placeholder-[#4a4660] outline-none focus:border-[#2d2a40]"
        />

        {/* Type */}
        <select
          value={field.field_type}
          onChange={e => onUpdate({ field_type: e.target.value as FieldType })}
          className="bg-[#13111c] border border-[#1c1928] rounded-lg px-2 py-1.5 text-[13px] text-[#e0dfe4] outline-none focus:border-[#2d2a40]"
        >
          {FIELD_TYPES.map(t => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>

        {/* Required toggle */}
        <button
          onClick={() => onUpdate({ is_required: !field.is_required })}
          title={field.is_required ? 'Required' : 'Optional'}
          className={`px-2 py-1.5 rounded-lg text-[11px] font-medium border transition-colors ${
            field.is_required
              ? 'border-[#ec4899]/30 text-[#ec4899] bg-[#ec4899]/10'
              : 'border-[#1c1928] text-[#4a4660] hover:text-[#7a7890]'
          }`}
        >
          Req
        </button>

        {/* Move */}
        <div className="flex flex-col">
          <button onClick={onMoveUp} disabled={isFirst} className="text-[#7a7890] hover:text-white disabled:opacity-20 disabled:cursor-default transition-colors">
            <ChevronUp size={14} />
          </button>
          <button onClick={onMoveDown} disabled={isLast} className="text-[#7a7890] hover:text-white disabled:opacity-20 disabled:cursor-default transition-colors">
            <ChevronDown size={14} />
          </button>
        </div>

        {/* Delete */}
        <button onClick={onDelete} className="text-[#7a7890] hover:text-red-400 transition-colors">
          <Trash2 size={14} />
        </button>
      </div>

      {/* Number prefix/suffix */}
      {field.field_type === 'number' && (
        <div className="flex items-center gap-2 pl-1">
          <input
            type="text"
            value={field.options?.prefix ?? ''}
            onChange={e => onUpdate({ options: { ...field.options, prefix: e.target.value } })}
            placeholder="Prefix (e.g. $)"
            className="w-24 bg-transparent border border-[#1c1928] rounded-lg px-2 py-1 text-[12px] text-white placeholder-[#4a4660] outline-none focus:border-[#2d2a40]"
          />
          <input
            type="text"
            value={field.options?.suffix ?? ''}
            onChange={e => onUpdate({ options: { ...field.options, suffix: e.target.value } })}
            placeholder="Suffix (e.g. /mo)"
            className="w-28 bg-transparent border border-[#1c1928] rounded-lg px-2 py-1 text-[12px] text-white placeholder-[#4a4660] outline-none focus:border-[#2d2a40]"
          />
        </div>
      )}

      {/* Select choices */}
      {field.field_type === 'select' && (
        <div className="flex flex-wrap items-center gap-1.5 pl-1">
          {choices.map(choice => (
            <span key={choice} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[12px] bg-[#ec4899]/15 text-[#ec4899] border border-[#ec4899]/20">
              {choice}
              <button onClick={() => removeChoice(choice)} className="hover:text-white transition-colors">
                <X size={10} />
              </button>
            </span>
          ))}
          <div className="flex items-center gap-1">
            <input
              type="text"
              value={newChoice}
              onChange={e => setNewChoice(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addChoice(); } }}
              placeholder="Add choice..."
              className="w-24 bg-transparent border border-[#1c1928] rounded-lg px-2 py-0.5 text-[12px] text-white placeholder-[#4a4660] outline-none focus:border-[#2d2a40]"
            />
            <button onClick={addChoice} className="text-[#7a7890] hover:text-[#ec4899] transition-colors">
              <Plus size={12} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
