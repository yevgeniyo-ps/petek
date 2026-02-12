import { useEffect, useState } from 'react';
import { Search, Trash2, Users, StickyNote, Shield } from 'lucide-react';
import { AdminUser } from '../types';
import { fetchUsers, deleteUserData } from '../lib/admin';
import { formatDate } from '../lib/utils';
import ConfirmDialog from '../components/ui/ConfirmDialog';

export default function AdminPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null);

  useEffect(() => {
    fetchUsers()
      .then(setUsers)
      .finally(() => setLoading(false));
  }, []);

  const handleDeleteData = async () => {
    if (!deleteTarget) return;
    await deleteUserData(deleteTarget.id);
    setUsers(prev =>
      prev.map(u =>
        u.id === deleteTarget.id
          ? { ...u, notes_count: 0, collections_count: 0, labels_count: 0 }
          : u
      )
    );
    setDeleteTarget(null);
  };

  const filtered = users.filter(u =>
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  const totalNotes = users.reduce((sum, u) => sum + u.notes_count, 0);
  const activeToday = users.filter(u => {
    if (!u.last_sign_in_at) return false;
    const d = new Date(u.last_sign_in_at);
    const now = new Date();
    return d.toDateString() === now.toDateString();
  }).length;

  if (loading) {
    return <div className="text-[#7a7890] text-[14px] text-center pt-40">Loading...</div>;
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <Shield size={22} className="text-[#ec4899]" />
        <h1 className="text-[22px] font-bold text-white">Admin</h1>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <StatCard icon={Users} label="Total users" value={users.length} />
        <StatCard icon={Users} label="Active today" value={activeToday} />
        <StatCard icon={StickyNote} label="Total notes" value={totalNotes} />
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#4a4660]" />
        <input
          type="text"
          placeholder="Search by email..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full bg-[#13111c] border border-[#1c1928] rounded-lg pl-10 pr-4 py-2.5 text-[13px] text-white placeholder-[#4a4660] outline-none focus:border-[#ec4899]/50 transition-colors"
        />
      </div>

      {/* Table */}
      <div className="rounded-xl border border-[#1c1928] overflow-hidden">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="bg-[#13111c] text-[#7a7890] text-left">
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Signed up</th>
              <th className="px-4 py-3 font-medium">Last active</th>
              <th className="px-4 py-3 font-medium text-right">Notes</th>
              <th className="px-4 py-3 font-medium text-right">Collections</th>
              <th className="px-4 py-3 font-medium text-right">Labels</th>
              <th className="px-4 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(user => (
              <tr key={user.id} className="border-t border-[#1c1928] hover:bg-white/[0.02] transition-colors">
                <td className="px-4 py-3 text-white">{user.email}</td>
                <td className="px-4 py-3 text-[#7a7890]">{formatDate(user.created_at)}</td>
                <td className="px-4 py-3 text-[#7a7890]">
                  {user.last_sign_in_at ? formatDate(user.last_sign_in_at) : '—'}
                </td>
                <td className="px-4 py-3 text-[#7a7890] text-right">{user.notes_count}</td>
                <td className="px-4 py-3 text-[#7a7890] text-right">{user.collections_count}</td>
                <td className="px-4 py-3 text-[#7a7890] text-right">{user.labels_count}</td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => setDeleteTarget(user)}
                    className="text-[#7a7890] hover:text-[#f87171] transition-colors p-1 rounded"
                    title="Delete user data"
                  >
                    <Trash2 size={14} />
                  </button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-[#7a7890]">
                  No users found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteData}
        title="Delete user data"
        message={`This will permanently delete all notes, collections, and labels for ${deleteTarget?.email}. The user account itself will remain.`}
        confirmLabel="Delete data"
      />
    </div>
  );
}

function StatCard({ icon: Icon, label, value }: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  value: number;
}) {
  return (
    <div className="bg-[#13111c] border border-[#1c1928] rounded-xl px-5 py-4">
      <div className="flex items-center gap-2 text-[#7a7890] mb-1">
        <Icon size={14} />
        <span className="text-[12px]">{label}</span>
      </div>
      <span className="text-[22px] font-bold text-white">{value}</span>
    </div>
  );
}
