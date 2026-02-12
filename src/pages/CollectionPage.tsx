import { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Search, Plus, Settings } from 'lucide-react';
import { useCollections } from '../context/CollectionsContext';
import { getCollectionIcon } from '../lib/icons';
import * as api from '../lib/collections';
import { CollectionItem } from '../types';
import CollectionTable from '../components/collections/CollectionTable';
import ItemEditor from '../components/collections/ItemEditor';
import CollectionSettings from '../components/collections/CollectionSettings';

export default function CollectionPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { collections, fieldsByCollection, loading: collectionsLoading } = useCollections();

  const collection = collections.find(c => c.slug === slug);
  const fields = collection ? (fieldsByCollection[collection.id] ?? []) : [];

  const [items, setItems] = useState<CollectionItem[]>([]);
  const [loadingItems, setLoadingItems] = useState(true);
  const [search, setSearch] = useState('');
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<CollectionItem | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const loadItems = useCallback(async () => {
    if (!collection) return;
    setLoadingItems(true);
    try {
      const data = await api.fetchItems(collection.id);
      setItems(data);
    } finally {
      setLoadingItems(false);
    }
  }, [collection]);

  useEffect(() => {
    if (collection) {
      loadItems();
    } else {
      setItems([]);
      setLoadingItems(false);
    }
  }, [collection, loadItems]);

  const filteredItems = useMemo(() => {
    if (!search) return items;
    const q = search.toLowerCase();
    return items.filter(item => {
      return fields.some(field => {
        if (field.field_type === 'checkbox') return false;
        const val = item.data[field.id];
        return val != null && String(val).toLowerCase().includes(q);
      });
    });
  }, [items, search, fields]);

  const handleSaveItem = async (data: Record<string, unknown>) => {
    if (!collection) return;
    if (editingItem) {
      const updated = await api.updateItem(editingItem.id, { data });
      setItems(prev => prev.map(i => i.id === editingItem.id ? updated : i));
    } else {
      const created = await api.createItem({ collection_id: collection.id, data });
      setItems(prev => [created, ...prev]);
    }
  };

  const handleDeleteItem = async (id: string) => {
    await api.deleteItem(id);
    setItems(prev => prev.filter(i => i.id !== id));
  };

  const handleNewItem = () => {
    setEditingItem(null);
    setEditorOpen(true);
  };

  const handleItemClick = (item: CollectionItem) => {
    setEditingItem(item);
    setEditorOpen(true);
  };

  const handleDeleted = () => {
    setSettingsOpen(false);
    navigate('/');
  };

  if (collectionsLoading) {
    return <div className="text-[#7a7890] text-[14px] text-center pt-40">Loading...</div>;
  }

  if (!collection) {
    return (
      <div className="text-center pt-40">
        <p className="text-[14px] text-[#7a7890]">Collection not found.</p>
        <button onClick={() => navigate('/')} className="text-[#ec4899] text-[13px] mt-2 hover:underline">
          Go home
        </button>
      </div>
    );
  }

  const Icon = getCollectionIcon(collection.icon);

  return (
    <div className="max-w-[1200px] px-12 py-10">
      {/* Page header */}
      <div className="mb-1 flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Icon size={24} className="text-[#ec4899]" />
          <div>
            <h1 className="text-[26px] font-bold text-white leading-tight">{collection.name}</h1>
            <p className="text-[14px] text-[#7a7890] mt-1">
              {items.length} {items.length === 1 ? 'item' : 'items'}
            </p>
          </div>
        </div>
        <button
          onClick={() => setSettingsOpen(true)}
          className="p-2 text-[#7a7890] hover:text-white hover:bg-white/[0.04] rounded-lg transition-all"
          title="Collection settings"
        >
          <Settings size={18} />
        </button>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between mt-8 mb-8">
        <div className="relative">
          <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#7a7890]" />
          <input
            type="text"
            placeholder={`Search ${collection.name.toLowerCase()}...`}
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-10 pr-5 py-2 bg-transparent border border-[#1c1928] rounded-full text-[13px] text-[#e0dfe4] placeholder-[#4a4660] outline-none focus:border-[#2d2a40] transition-colors w-72"
          />
        </div>
      </div>

      {/* Table */}
      {loadingItems ? (
        <div className="text-[#7a7890] text-[14px] text-center pt-20">Loading items...</div>
      ) : (
        <CollectionTable
          fields={fields}
          items={filteredItems}
          onItemClick={handleItemClick}
          onDeleteItem={handleDeleteItem}
        />
      )}

      {/* Item Editor */}
      <ItemEditor
        open={editorOpen}
        onClose={() => { setEditorOpen(false); setEditingItem(null); }}
        onSave={handleSaveItem}
        fields={fields}
        item={editingItem}
      />

      {/* Settings */}
      {settingsOpen && (
        <CollectionSettings
          open={settingsOpen}
          onClose={() => setSettingsOpen(false)}
          collection={collection}
          fields={fields}
          onDeleted={handleDeleted}
        />
      )}

      {/* FAB */}
      <button
        onClick={handleNewItem}
        className="fixed bottom-8 right-8 w-14 h-14 rounded-full bg-[#ec4899] hover:bg-[#db2777] text-white shadow-lg shadow-[#ec4899]/25 hover:shadow-[#ec4899]/40 transition-all flex items-center justify-center z-30"
        title="Add Item"
      >
        <Plus size={24} strokeWidth={2.5} />
      </button>
    </div>
  );
}
