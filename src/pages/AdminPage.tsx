import { useEffect, useState } from 'react';
import { Search, Trash2, Users, StickyNote, Shield, HardDrive, Umbrella, FolderOpen, UserX, UserCheck, CheckCircle, Clock, UserMinus, ChevronDown, Trophy } from 'lucide-react';
import { AdminUser } from '../types';
import { fetchUsers, deleteUserData, suspendUser, unsuspendUser, approveUser, removeUser, updateUserFeatures } from '../lib/admin';
import { formatDate } from '../lib/utils';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../i18n';
import ConfirmDialog from '../components/ui/ConfirmDialog';

const ALL_FEATURES = ['notes', 'challenges', 'insurances', 'subscriptions', 'collections'];

export default function AdminPage() {
  const { user: currentUser } = useAuth();
  const { t, language } = useLanguage();
  const localeMap: Record<string, string> = { en: 'en-US', ru: 'ru-RU', he: 'he-IL', es: 'es-ES' };
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null);
  const [suspendTarget, setSuspendTarget] = useState<AdminUser | null>(null);
  const [approveTarget, setApproveTarget] = useState<AdminUser | null>(null);
  const [removeTarget, setRemoveTarget] = useState<AdminUser | null>(null);
  const [expandedUser, setExpandedUser] = useState<string | null>(null);

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
          ? { ...u, notes_count: 0, collections_count: 0, labels_count: 0, policies_count: 0, challenges_count: 0, disk_usage: 0, notes_this_month: 0, policies_this_month: 0, last_activity_at: null }
          : u
      )
    );
    setDeleteTarget(null);
  };

  const isSelf = (u: AdminUser) => u.id === currentUser?.id;
  const isPending = (u: AdminUser) => !u.approved_at;
  const isSuspended = (u: AdminUser) => u.banned_until && new Date(u.banned_until) > new Date();

  const handleToggleSuspend = async () => {
    if (!suspendTarget) return;
    if (isSuspended(suspendTarget)) {
      await unsuspendUser(suspendTarget.id);
      setUsers(prev => prev.map(u => u.id === suspendTarget.id ? { ...u, banned_until: null } : u));
    } else {
      await suspendUser(suspendTarget.id);
      setUsers(prev => prev.map(u => u.id === suspendTarget.id ? { ...u, banned_until: '2999-12-31T00:00:00Z' } : u));
    }
    setSuspendTarget(null);
  };

  const handleApprove = async () => {
    if (!approveTarget) return;
    await approveUser(approveTarget.id);
    setUsers(prev => prev.map(u => u.id === approveTarget.id ? { ...u, approved_at: new Date().toISOString() } : u));
    setApproveTarget(null);
  };

  const handleRemoveUser = async () => {
    if (!removeTarget) return;
    await removeUser(removeTarget.id);
    setUsers(prev => prev.filter(u => u.id !== removeTarget.id));
    setRemoveTarget(null);
  };

  const filtered = users.filter(u =>
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  const pendingCount = users.filter(u => isPending(u)).length;
  const totalNotes = users.reduce((sum, u) => sum + u.notes_count, 0);
  const totalPolicies = users.reduce((sum, u) => sum + u.policies_count, 0);
  const totalCollections = users.reduce((sum, u) => sum + u.collections_count, 0);
  const totalChallenges = users.reduce((sum, u) => sum + u.challenges_count, 0);
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const activeThisWeek = users.filter(u => u.last_activity_at && new Date(u.last_activity_at) >= weekAgo).length;

  const getActivityStatus = (u: AdminUser) => {
    if (!u.last_activity_at) return 'dormant';
    const d = new Date(u.last_activity_at);
    if (d >= weekAgo) return 'active';
    if (d >= monthAgo) return 'idle';
    return 'dormant';
  };

  if (loading) {
    return <div className="text-[#7a7890] text-[14px] text-center pt-40">{t.common.loading}</div>;
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <Shield size={22} className="text-[#ec4899]" />
        <h1 className="text-[22px] font-bold text-white">{t.admin.title}</h1>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        <StatCard icon={Users} label={t.admin.totalUsers} value={users.length} />
        <StatCard icon={Clock} label={t.admin.pendingUsers} value={pendingCount} />
        <StatCard icon={Users} label={t.admin.activeThisWeek} value={activeThisWeek} />
        <StatCard icon={StickyNote} label={t.admin.totalNotes} value={totalNotes} />
        <StatCard icon={Umbrella} label={t.admin.totalPolicies} value={totalPolicies} />
        <StatCard icon={FolderOpen} label={t.admin.totalCollections} value={totalCollections} />
        <StatCard icon={Trophy} label={t.admin.totalChallenges} value={totalChallenges} />
        <StatCard icon={HardDrive} label={t.admin.totalDisk} value={formatBytes(users.reduce((sum, u) => sum + u.disk_usage, 0))} />
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#4a4660]" />
        <input
          type="text"
          placeholder={t.admin.searchPlaceholder}
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full bg-[#13111c] border border-[#1c1928] rounded-lg pl-10 pr-4 py-2.5 text-[13px] text-white placeholder-[#4a4660] outline-none focus:border-[#ec4899]/50 transition-colors"
        />
      </div>

      {/* Table */}
      <div className="rounded-xl border border-[#1c1928] overflow-hidden">
        <div className="overflow-x-auto">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="bg-[#13111c] text-[#7a7890] text-left">
              <th className="px-4 py-3 font-medium">{t.admin.email}</th>
              <th className="px-4 py-3 font-medium">{t.admin.signedUp}</th>
              <th className="px-4 py-3 font-medium">{t.admin.lastActive}</th>
              <th className="px-4 py-3 font-medium text-center">{t.admin.stats}</th>
              <th className="px-4 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(user => {
              const isExpanded = expandedUser === user.id;
              const hasStats = user.notes_count > 0 || user.policies_count > 0 || user.collections_count > 0 || user.challenges_count > 0 || user.disk_usage > 0;
              return (
                <tr key={user.id} className="border-t border-[#1c1928] hover:bg-white/[0.02] transition-colors align-top">
                  <td className="px-4 py-3">
                    <div className="text-white">
                      {user.email}
                      {isPending(user) && (
                        <span className="ml-2 text-[10px] font-medium bg-yellow-500/15 text-yellow-400 px-1.5 py-0.5 rounded">{t.common.pending}</span>
                      )}
                      {isSuspended(user) && (
                        <span className="ml-2 text-[10px] font-medium bg-red-500/15 text-red-400 px-1.5 py-0.5 rounded">{t.common.suspended}</span>
                      )}
                      {(() => {
                        const status = getActivityStatus(user);
                        const cfg = status === 'active'
                          ? { bg: 'bg-emerald-500/15', text: 'text-emerald-400', label: t.admin.active }
                          : status === 'idle'
                          ? { bg: 'bg-yellow-500/15', text: 'text-yellow-400', label: t.admin.idle }
                          : { bg: 'bg-red-500/15', text: 'text-red-400', label: t.admin.dormant };
                        return <span className={`ml-2 text-[10px] font-medium ${cfg.bg} ${cfg.text} px-1.5 py-0.5 rounded`}>{cfg.label}</span>;
                      })()}
                    </div>
                    {!isSelf(user) && (
                      <FeatureChips
                        features={user.features ?? ALL_FEATURES}
                        userId={user.id}
                        onUpdate={(newFeatures) => {
                          setUsers(prev => prev.map(u => u.id === user.id ? { ...u, features: newFeatures } : u));
                        }}
                      />
                    )}
                  </td>
                  <td className="px-4 py-3 text-[#7a7890]">{formatDate(user.created_at, localeMap[language], { yesterday: t.common.yesterday, daysAgo: t.common.daysAgo })}</td>
                  <td className="px-4 py-3 text-[#7a7890]">
                    {user.last_activity_at ? formatDate(user.last_activity_at, localeMap[language], { yesterday: t.common.yesterday, daysAgo: t.common.daysAgo }) : '—'}
                  </td>
                  <td className="px-4 py-3">
                    {hasStats ? (
                      <div>
                        <button
                          onClick={() => setExpandedUser(isExpanded ? null : user.id)}
                          className="flex items-center gap-1.5 mx-auto text-[#7a7890] hover:text-white transition-colors"
                        >
                          <ChevronDown size={14} className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                        </button>
                        {isExpanded && (
                          <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-[11px] min-w-[160px]">
                            <StatRow label="Notes" value={user.notes_count} extra={user.notes_this_month} />
                            <StatRow label="Policies" value={user.policies_count} extra={user.policies_this_month} />
                            <StatRow label="Collections" value={user.collections_count} />
                            <StatRow label="Challenges" value={user.challenges_count} />
                            <StatRow label="Labels" value={user.labels_count} />
                            <StatRow label="Disk" value={formatBytes(user.disk_usage)} />
                            <StatRow label={t.admin.lastLogin} value={user.last_sign_in_at ? formatDate(user.last_sign_in_at, localeMap[language], { yesterday: t.common.yesterday, daysAgo: t.common.daysAgo }) : '—'} />
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-[#4a4660] text-[11px] flex justify-center">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {isSelf(user) ? (
                        <span className="text-[11px] text-[#4a4660]">{t.common.you}</span>
                      ) : (
                        <>
                          {isPending(user) && (
                            <button
                              onClick={() => setApproveTarget(user)}
                              className="text-[#7a7890] hover:text-emerald-400 transition-colors p-1 rounded"
                              title={t.admin.approveUser}
                            >
                              <CheckCircle size={14} />
                            </button>
                          )}
                          <button
                            onClick={() => setSuspendTarget(user)}
                            className={`transition-colors p-1 rounded ${isSuspended(user) ? 'text-[#7a7890] hover:text-emerald-400' : 'text-[#7a7890] hover:text-[#f87171]'}`}
                            title={isSuspended(user) ? t.admin.unsuspendUser : t.admin.suspendUser}
                          >
                            {isSuspended(user) ? <UserCheck size={14} /> : <UserX size={14} />}
                          </button>
                          <button
                            onClick={() => setDeleteTarget(user)}
                            className="text-[#7a7890] hover:text-[#f87171] transition-colors p-1 rounded"
                            title={t.admin.deleteUserData}
                          >
                            <Trash2 size={14} />
                          </button>
                          <button
                            onClick={() => setRemoveTarget(user)}
                            className="text-[#7a7890] hover:text-[#f87171] transition-colors p-1 rounded"
                            title={t.admin.removeUser}
                          >
                            <UserMinus size={14} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-[#7a7890]">
                  {t.admin.noUsersFound}
                </td>
              </tr>
            )}
          </tbody>
        </table>
        </div>
      </div>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteData}
        title={t.admin.deleteUserData}
        message={t.admin.deleteDataMessage.replace('{email}', deleteTarget?.email ?? '')}
        confirmLabel={t.admin.deleteData}
      />

      <ConfirmDialog
        open={!!suspendTarget}
        onClose={() => setSuspendTarget(null)}
        onConfirm={handleToggleSuspend}
        title={suspendTarget && isSuspended(suspendTarget) ? t.admin.unsuspendUser : t.admin.suspendUser}
        message={
          suspendTarget && isSuspended(suspendTarget)
            ? t.admin.unsuspendMessage.replace('{email}', suspendTarget?.email ?? '')
            : t.admin.suspendMessage.replace('{email}', suspendTarget?.email ?? '')
        }
        confirmLabel={suspendTarget && isSuspended(suspendTarget) ? t.admin.unsuspend : t.admin.suspend}
      />

      <ConfirmDialog
        open={!!approveTarget}
        onClose={() => setApproveTarget(null)}
        onConfirm={handleApprove}
        title={t.admin.approveUser}
        message={t.admin.approveMessage.replace('{email}', approveTarget?.email ?? '')}
        confirmLabel={t.admin.approve}
        variant="success"
      />

      <ConfirmDialog
        open={!!removeTarget}
        onClose={() => setRemoveTarget(null)}
        onConfirm={handleRemoveUser}
        title={t.admin.removeUser}
        message={t.admin.removeMessage.replace('{email}', removeTarget?.email ?? '')}
        confirmLabel={t.admin.removeUserLabel}
      />
    </div>
  );
}

function FeatureChips({ features, userId, onUpdate }: {
  features: string[];
  userId: string;
  onUpdate: (features: string[]) => void;
}) {
  const toggle = async (feat: string) => {
    const next = features.includes(feat)
      ? features.filter(f => f !== feat)
      : [...features, feat];
    onUpdate(next);
    await updateUserFeatures(userId, next);
  };

  return (
    <div className="flex flex-wrap gap-1 mt-1.5">
      {ALL_FEATURES.map(feat => {
        const enabled = features.includes(feat);
        return (
          <button
            key={feat}
            onClick={() => toggle(feat)}
            className={`text-[10px] px-1.5 py-0.5 rounded transition-colors ${
              enabled
                ? 'bg-[#ec4899]/15 text-[#ec4899]'
                : 'bg-white/[0.04] text-[#4a4660] hover:text-[#7a7890]'
            }`}
          >
            {feat}
          </button>
        );
      })}
    </div>
  );
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + units[i];
}

function StatRow({ label, value, extra }: { label: string; value: number | string; extra?: number }) {
  return (
    <>
      <span className="text-[#7a7890]">{label}</span>
      <span className="text-white text-right">
        {value}
        {extra != null && extra > 0 && <span className="ml-1 text-emerald-400">+{extra}</span>}
      </span>
    </>
  );
}

function StatCard({ icon: Icon, label, value }: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  value: number | string;
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
