import { useState, useMemo } from 'react';
import { RepeatIcon, Search, Plus } from 'lucide-react';
import { useSubscriptions } from '../context/SubscriptionsContext';
import SubscriptionDashboard from '../components/subscriptions/SubscriptionDashboard';
import SubscriptionTable from '../components/subscriptions/SubscriptionTable';
import SubscriptionEditor from '../components/subscriptions/SubscriptionEditor';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import { Subscription, SubscriptionCategory } from '../types';
import { getCategoryLabel } from '../lib/subscription-constants';

export default function SubscriptionsPage() {
  const { subscriptions, loading, createSubscription, updateSubscription, deleteSubscription } = useSubscriptions();
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<SubscriptionCategory | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingSubscription, setEditingSubscription] = useState<Subscription | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deletingSubscription, setDeletingSubscription] = useState<Subscription | null>(null);

  const categories = useMemo(() => {
    const cats = new Set<SubscriptionCategory>();
    for (const s of subscriptions) cats.add(s.category);
    return Array.from(cats);
  }, [subscriptions]);

  const filteredSubscriptions = useMemo(() => {
    let result = subscriptions;

    if (selectedCategory) {
      result = result.filter(s => s.category === selectedCategory);
    }

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(s =>
        s.name.toLowerCase().includes(q) ||
        s.notes.toLowerCase().includes(q) ||
        s.url.toLowerCase().includes(q) ||
        getCategoryLabel(s.category).toLowerCase().includes(q)
      );
    }

    return result;
  }, [subscriptions, search, selectedCategory]);

  const handleCreate = () => {
    setEditingSubscription(null);
    setEditorOpen(true);
  };

  const handleEdit = (sub: Subscription) => {
    setEditingSubscription(sub);
    setEditorOpen(true);
  };

  const handleSave = async (data: Omit<Subscription, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (editingSubscription) {
      await updateSubscription(editingSubscription.id, data);
    } else {
      await createSubscription(data);
    }
  };

  const handleDeleteConfirm = (sub: Subscription) => {
    setDeletingSubscription(sub);
    setDeleteConfirmOpen(true);
  };

  const handleDelete = async () => {
    if (deletingSubscription) {
      await deleteSubscription(deletingSubscription.id);
      setDeleteConfirmOpen(false);
      setDeletingSubscription(null);
    }
  };

  if (loading) {
    return <div className="text-[#7a7890] text-[14px] text-center pt-40">Loading...</div>;
  }

  // Empty state
  if (subscriptions.length === 0) {
    return (
      <div className="max-w-[1200px] px-4 py-6 md:px-12 md:py-10">
        <div className="flex items-center gap-3 mb-1">
          <RepeatIcon size={24} className="text-[#ec4899]" />
          <h1 className="text-[26px] font-bold text-white leading-tight">Subscriptions</h1>
        </div>
        <p className="text-[14px] text-[#7a7890] mt-2 mb-8">
          Track your recurring subscriptions and payments.
        </p>

        <div className="flex flex-col items-center justify-center py-20 rounded-xl bg-[#0f0d18] border border-[#1c1928]">
          <RepeatIcon size={40} className="text-[#4a4660] mb-4" />
          <p className="text-[15px] text-[#7a7890] mb-4">No subscriptions yet</p>
          <button
            onClick={handleCreate}
            className="flex items-center gap-2 px-5 py-2.5 text-[13px] font-medium text-white bg-[#ec4899] hover:bg-[#db2777] rounded-full transition-colors"
          >
            <Plus size={16} />
            Add Subscription
          </button>
        </div>

        <SubscriptionEditor
          subscription={null}
          open={editorOpen}
          onClose={() => setEditorOpen(false)}
          onSave={handleSave}
        />
      </div>
    );
  }

  return (
    <div className="max-w-[1200px] px-4 py-6 md:px-12 md:py-10">
      {/* Header */}
      <div className="mb-1 flex items-start justify-between">
        <div className="flex items-center gap-3">
          <RepeatIcon size={24} className="text-[#ec4899]" />
          <div>
            <h1 className="text-[26px] font-bold text-white leading-tight">Subscriptions</h1>
            <p className="text-[14px] text-[#7a7890] mt-1">
              {subscriptions.length} {subscriptions.length === 1 ? 'subscription' : 'subscriptions'}
            </p>
          </div>
        </div>
        <button
          onClick={handleCreate}
          className="flex items-center gap-2 px-4 py-2 text-[13px] font-medium text-white bg-[#ec4899] hover:bg-[#db2777] rounded-full transition-colors"
        >
          <Plus size={16} />
          Add
        </button>
      </div>

      {/* Dashboard */}
      <SubscriptionDashboard subscriptions={subscriptions} />

      {/* Toolbar */}
      <div className="flex items-center gap-4 mb-6">
        <div className="relative">
          <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#7a7890]" />
          <input
            type="text"
            placeholder="Search subscriptions..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-10 pr-5 py-2 bg-transparent border border-[#1c1928] rounded-full text-[13px] text-[#e0dfe4] placeholder-[#4a4660] outline-none focus:border-[#2d2a40] transition-colors w-full md:w-72"
          />
        </div>
      </div>

      {/* Category filter chips */}
      {categories.length > 1 && (
        <div className="flex items-center gap-2 mb-6 flex-wrap">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-3 py-1.5 rounded-full text-[12px] font-medium transition-colors ${
              !selectedCategory
                ? 'bg-[#ec4899] text-white'
                : 'bg-white/[0.04] text-[#7a7890] hover:text-white hover:bg-white/[0.08]'
            }`}
          >
            All
          </button>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(selectedCategory === cat ? null : cat)}
              className={`px-3 py-1.5 rounded-full text-[12px] font-medium transition-colors ${
                selectedCategory === cat
                  ? 'bg-[#ec4899] text-white'
                  : 'bg-white/[0.04] text-[#7a7890] hover:text-white hover:bg-white/[0.08]'
              }`}
            >
              {getCategoryLabel(cat)}
            </button>
          ))}
        </div>
      )}

      {/* Table */}
      <SubscriptionTable
        subscriptions={filteredSubscriptions}
        onEdit={handleEdit}
        onDelete={handleDeleteConfirm}
      />

      {/* Editor modal */}
      <SubscriptionEditor
        subscription={editingSubscription}
        open={editorOpen}
        onClose={() => setEditorOpen(false)}
        onSave={handleSave}
      />

      {/* Delete confirmation */}
      <ConfirmDialog
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={handleDelete}
        title="Delete subscription?"
        message={`This will permanently remove "${deletingSubscription?.name}".`}
        confirmLabel="Delete"
      />
    </div>
  );
}
