import { useState, useEffect } from 'react';
import Modal from '../ui/Modal';
import { CollectionField, CollectionItem } from '../../types';

interface ItemEditorProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: Record<string, unknown>) => Promise<void>;
  fields: CollectionField[];
  item: CollectionItem | null;
}

export default function ItemEditor({ open, onClose, onSave, fields, item }: ItemEditorProps) {
  const [data, setData] = useState<Record<string, unknown>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setData(item?.data ?? {});
    }
  }, [open, item]);

  const setValue = (fieldId: string, value: unknown) => {
    setData(prev => ({ ...prev, [fieldId]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave(data);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose}>
      <form onSubmit={handleSubmit} className="p-6">
        <h3 className="text-[15px] font-semibold text-white mb-5">
          {item ? 'Edit Item' : 'Add Item'}
        </h3>

        <div className="space-y-4 max-h-[60vh] overflow-y-auto">
          {fields.map(field => (
            <div key={field.id}>
              <label className="block text-[13px] text-[#b0adc0] mb-1.5">
                {field.name}
                {field.is_required && <span className="text-[#ec4899] ml-0.5">*</span>}
              </label>
              <FieldInput
                field={field}
                value={data[field.id]}
                onChange={v => setValue(field.id, v)}
              />
            </div>
          ))}
        </div>

        {fields.length === 0 && (
          <p className="text-[13px] text-[#7a7890] py-4">No fields defined. Add fields in collection settings first.</p>
        )}

        <div className="flex justify-end gap-2.5 mt-6 pt-4 border-t border-[#1c1928]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-[13px] text-[#7a7890] hover:text-white rounded-lg hover:bg-white/[0.04] transition-all"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving || fields.length === 0}
            className="px-5 py-2 text-[13px] bg-[#ec4899] hover:bg-[#db2777] text-white font-medium rounded-full transition-colors disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function FieldInput({ field, value, onChange }: { field: CollectionField; value: unknown; onChange: (v: unknown) => void }) {
  const baseClass = 'w-full bg-transparent border border-[#1c1928] rounded-lg px-3 py-2 text-[13px] text-white placeholder-[#4a4660] outline-none focus:border-[#2d2a40] transition-colors';

  switch (field.field_type) {
    case 'text':
      return (
        <input
          type="text"
          value={String(value ?? '')}
          onChange={e => onChange(e.target.value)}
          placeholder={`Enter ${field.name.toLowerCase()}...`}
          required={field.is_required}
          className={baseClass}
        />
      );

    case 'number':
      return (
        <div className="flex items-center gap-2">
          {field.options?.prefix && <span className="text-[13px] text-[#7a7890]">{field.options.prefix}</span>}
          <input
            type="number"
            value={value !== undefined && value !== null ? String(value) : ''}
            onChange={e => onChange(e.target.value ? Number(e.target.value) : null)}
            placeholder="0"
            required={field.is_required}
            className={baseClass}
            step="any"
          />
          {field.options?.suffix && <span className="text-[13px] text-[#7a7890]">{field.options.suffix}</span>}
        </div>
      );

    case 'date':
      return (
        <input
          type="date"
          value={String(value ?? '')}
          onChange={e => onChange(e.target.value)}
          required={field.is_required}
          className={`${baseClass} [color-scheme:dark]`}
        />
      );

    case 'select': {
      const choices = field.options?.choices ?? [];
      return (
        <select
          value={String(value ?? '')}
          onChange={e => onChange(e.target.value)}
          required={field.is_required}
          className={`${baseClass} bg-[#13111c]`}
        >
          <option value="">Select...</option>
          {choices.map(c => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      );
    }

    case 'checkbox':
      return (
        <button
          type="button"
          onClick={() => onChange(!value)}
          className={`w-9 h-9 rounded-lg border-2 flex items-center justify-center transition-all ${
            value
              ? 'border-[#ec4899] bg-[#ec4899]/20 text-[#ec4899]'
              : 'border-[#1c1928] text-[#4a4660] hover:border-[#2d2a40]'
          }`}
        >
          {value ? '✓' : ''}
        </button>
      );

    case 'url':
      return (
        <input
          type="url"
          value={String(value ?? '')}
          onChange={e => onChange(e.target.value)}
          placeholder="https://..."
          required={field.is_required}
          className={baseClass}
        />
      );

    default:
      return (
        <input
          type="text"
          value={String(value ?? '')}
          onChange={e => onChange(e.target.value)}
          className={baseClass}
        />
      );
  }
}
