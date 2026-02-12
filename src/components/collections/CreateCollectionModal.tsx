import { useState } from 'react';
import { Plus, Trash2, ArrowRight, ArrowLeft } from 'lucide-react';
import Modal from '../ui/Modal';
import IconPicker from './IconPicker';
import { useCollections } from '../../context/CollectionsContext';
import { useNavigate } from 'react-router-dom';
import { FieldType, CollectionField } from '../../types';
import { slugify } from '../../lib/utils';

interface CreateCollectionModalProps {
  open: boolean;
  onClose: () => void;
}

interface DraftField {
  id: string;
  name: string;
  field_type: FieldType;
  options: Record<string, unknown>;
  position: number;
  is_required: boolean;
}

const FIELD_TYPES: { value: FieldType; label: string }[] = [
  { value: 'text', label: 'Text' },
  { value: 'number', label: 'Number' },
  { value: 'date', label: 'Date' },
  { value: 'select', label: 'Select' },
  { value: 'checkbox', label: 'Checkbox' },
  { value: 'url', label: 'URL' },
];

export default function CreateCollectionModal({ open, onClose }: CreateCollectionModalProps) {
  const { createCollection } = useCollections();
  const navigate = useNavigate();
  const [step, setStep] = useState<1 | 2>(1);
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('folder');
  const [fields, setFields] = useState<DraftField[]>([]);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  const reset = () => {
    setStep(1);
    setName('');
    setIcon('folder');
    setFields([]);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const addField = () => {
    setFields(prev => [...prev, {
      id: crypto.randomUUID(),
      name: '',
      field_type: 'text',
      options: {},
      position: prev.length,
      is_required: false,
    }]);
  };

  const updateField = (id: string, updates: Partial<DraftField>) => {
    setFields(prev => prev.map(f => f.id === id ? { ...f, ...updates } : f));
  };

  const removeField = (id: string) => {
    setFields(prev => prev.filter(f => f.id !== id).map((f, i) => ({ ...f, position: i })));
  };

  const handleCreate = async () => {
    if (!name.trim()) return;
    setCreating(true);
    setError('');
    try {
      const validFields = fields
        .filter(f => f.name.trim())
        .map((f, i) => ({
          name: f.name,
          field_type: f.field_type,
          options: f.options,
          position: i,
          is_required: f.is_required,
        }));
      const col = await createCollection(name.trim(), icon, validFields as Omit<CollectionField, 'id' | 'collection_id' | 'created_at'>[]);
      handleClose();
      navigate(`/c/${col.slug}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : (err as { message?: string })?.message ?? String(err);
      setError(msg);
    } finally {
      setCreating(false);
    }
  };

  return (
    <Modal open={open} onClose={handleClose}>
      <div className="p-6">
        {step === 1 ? (
          <>
            <h3 className="text-[15px] font-semibold text-white mb-5">New Collection</h3>

            <div className="mb-4">
              <label className="block text-[13px] text-[#b0adc0] mb-1.5">Name</label>
              <input
                autoFocus
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && name.trim()) setStep(2); }}
                placeholder="e.g. Insurances, Subscriptions..."
                className="w-full bg-transparent border border-[#1c1928] rounded-lg px-3 py-2 text-[13px] text-white placeholder-[#4a4660] outline-none focus:border-[#2d2a40] transition-colors"
              />
              {name.trim() && (
                <p className="text-[11px] text-[#4a4660] mt-1">slug: {slugify(name)}</p>
              )}
            </div>

            <div className="mb-5">
              <label className="block text-[13px] text-[#b0adc0] mb-1.5">Icon</label>
              <IconPicker current={icon} onChange={setIcon} />
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setStep(2)}
                disabled={!name.trim()}
                className="inline-flex items-center gap-1.5 px-5 py-2 text-[13px] bg-[#ec4899] hover:bg-[#db2777] text-white font-medium rounded-full transition-colors disabled:opacity-50"
              >
                Next
                <ArrowRight size={14} />
              </button>
            </div>
          </>
        ) : (
          <>
            <h3 className="text-[15px] font-semibold text-white mb-1">Define Fields</h3>
            <p className="text-[12px] text-[#7a7890] mb-5">Add columns for your "{name}" collection. You can also add fields later.</p>

            <div className="space-y-2 max-h-[40vh] overflow-y-auto mb-4">
              {fields.map(field => (
                <div key={field.id} className="flex items-center gap-2 p-2 rounded-lg border border-[#1c1928] bg-[#0f0d18]">
                  <input
                    type="text"
                    value={field.name}
                    onChange={e => updateField(field.id, { name: e.target.value })}
                    placeholder="Field name"
                    className="flex-1 bg-transparent border border-[#1c1928] rounded-lg px-2.5 py-1.5 text-[13px] text-white placeholder-[#4a4660] outline-none focus:border-[#2d2a40]"
                  />
                  <select
                    value={field.field_type}
                    onChange={e => updateField(field.id, { field_type: e.target.value as FieldType })}
                    className="bg-[#13111c] border border-[#1c1928] rounded-lg px-2 py-1.5 text-[13px] text-[#e0dfe4] outline-none"
                  >
                    {FIELD_TYPES.map(t => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                  <button
                    onClick={() => removeField(field.id)}
                    className="text-[#7a7890] hover:text-red-400 transition-colors p-1"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>

            <button
              onClick={addField}
              className="inline-flex items-center gap-1.5 text-[13px] text-[#7a7890] hover:text-[#ec4899] transition-colors mb-5"
            >
              <Plus size={14} />
              Add Field
            </button>

            {error && (
              <p className="text-[12px] text-red-400 mb-3">{error}</p>
            )}

            <div className="flex justify-between pt-4 border-t border-[#1c1928]">
              <button
                onClick={() => setStep(1)}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-[13px] text-[#7a7890] hover:text-white rounded-lg hover:bg-white/[0.04] transition-all"
              >
                <ArrowLeft size={14} />
                Back
              </button>
              <button
                onClick={handleCreate}
                disabled={creating}
                className="px-5 py-2 text-[13px] bg-[#ec4899] hover:bg-[#db2777] text-white font-medium rounded-full transition-colors disabled:opacity-50"
              >
                {creating ? 'Creating...' : 'Create Collection'}
              </button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
