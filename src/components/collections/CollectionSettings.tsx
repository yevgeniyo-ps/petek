import { useState } from 'react';
import { Plus } from 'lucide-react';
import Modal from '../ui/Modal';
import ConfirmDialog from '../ui/ConfirmDialog';
import IconPicker from './IconPicker';
import FieldEditor from './FieldEditor';
import { useCollections } from '../../context/CollectionsContext';
import { Collection, CollectionField } from '../../types';
import { slugify } from '../../lib/utils';
import { getCollectionIcon } from '../../lib/icons';

interface CollectionSettingsProps {
  open: boolean;
  onClose: () => void;
  collection: Collection;
  fields: CollectionField[];
  onDeleted: () => void;
}

export default function CollectionSettings({ open, onClose, collection, fields, onDeleted }: CollectionSettingsProps) {
  const { updateCollection, deleteCollection, createField, updateField, deleteField, refreshFields } = useCollections();
  const [name, setName] = useState(collection.name);
  const [icon, setIcon] = useState(collection.icon);
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      const updates: Partial<Pick<Collection, 'name' | 'icon' | 'slug'>> = {};
      if (name !== collection.name) {
        updates.name = name.trim();
        updates.slug = slugify(name.trim());
      }
      if (icon !== collection.icon) {
        updates.icon = icon;
      }
      if (Object.keys(updates).length > 0) {
        await updateCollection(collection.id, updates);
      }
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    await deleteCollection(collection.id);
    onDeleted();
  };

  const handleAddField = async () => {
    await createField(collection.id, {
      name: '',
      field_type: 'text',
      position: fields.length,
    });
  };

  const handleUpdateField = async (id: string, updates: Partial<Pick<CollectionField, 'name' | 'field_type' | 'options' | 'position' | 'is_required'>>) => {
    await updateField(id, updates);
  };

  const handleDeleteField = async (id: string) => {
    await deleteField(id, collection.id);
  };

  const handleMoveField = async (index: number, direction: 'up' | 'down') => {
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= fields.length) return;

    const fieldA = fields[index]!;
    const fieldB = fields[swapIndex]!;
    await Promise.all([
      updateField(fieldA.id, { position: fieldB.position }),
      updateField(fieldB.id, { position: fieldA.position }),
    ]);
    await refreshFields(collection.id);
  };

  return (
    <>
      <Modal open={open} onClose={onClose}>
        <div className="p-6 max-h-[80vh] overflow-y-auto">
          <h3 className="text-[15px] font-semibold text-white mb-5">Collection Settings</h3>

          {/* Name */}
          <div className="mb-4">
            <label className="block text-[13px] text-[#b0adc0] mb-1.5">Name</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full bg-transparent border border-[#1c1928] rounded-lg px-3 py-2 text-[13px] text-white placeholder-[#4a4660] outline-none focus:border-[#2d2a40] transition-colors"
            />
          </div>

          {/* Icon */}
          <div className="mb-6">
            <label className="block text-[13px] text-[#b0adc0] mb-1.5">Icon</label>
            <button
              onClick={() => setShowIconPicker(!showIconPicker)}
              className="flex items-center gap-2 px-3 py-2 border border-[#1c1928] rounded-lg text-[13px] text-[#e0dfe4] hover:border-[#2d2a40] transition-colors"
            >
              {(() => {
                const Icon = getCollectionIcon(icon);
                return <Icon size={16} />;
              })()}
              <span>{icon}</span>
            </button>
            {showIconPicker && (
              <div className="mt-2 border border-[#1c1928] rounded-lg bg-[#0f0d18]">
                <IconPicker current={icon} onChange={i => { setIcon(i); setShowIconPicker(false); }} />
              </div>
            )}
          </div>

          {/* Fields */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <label className="text-[13px] text-[#b0adc0]">Fields</label>
              <button
                onClick={handleAddField}
                className="inline-flex items-center gap-1 text-[12px] text-[#7a7890] hover:text-[#ec4899] transition-colors"
              >
                <Plus size={12} />
                Add
              </button>
            </div>
            <div className="space-y-2">
              {fields.map((field, i) => (
                <FieldEditor
                  key={field.id}
                  field={field}
                  isFirst={i === 0}
                  isLast={i === fields.length - 1}
                  onUpdate={updates => handleUpdateField(field.id, updates)}
                  onDelete={() => handleDeleteField(field.id)}
                  onMoveUp={() => handleMoveField(i, 'up')}
                  onMoveDown={() => handleMoveField(i, 'down')}
                />
              ))}
              {fields.length === 0 && (
                <p className="text-[12px] text-[#4a4660] py-4 text-center">No fields yet.</p>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-[#1c1928]">
            <button
              onClick={() => setConfirmDelete(true)}
              className="text-[13px] text-red-400 hover:text-red-300 transition-colors"
            >
              Delete Collection
            </button>
            <div className="flex gap-2.5">
              <button
                onClick={onClose}
                className="px-4 py-2 text-[13px] text-[#7a7890] hover:text-white rounded-lg hover:bg-white/[0.04] transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !name.trim()}
                className="px-5 py-2 text-[13px] bg-[#ec4899] hover:bg-[#db2777] text-white font-medium rounded-full transition-colors disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={handleDelete}
        title="Delete Collection"
        message={`Are you sure you want to delete "${collection.name}"? All items in this collection will be permanently deleted.`}
      />
    </>
  );
}
