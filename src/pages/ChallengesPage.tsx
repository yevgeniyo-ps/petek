import { useState, useMemo } from 'react';
import { Trophy, Plus, Check, X, Trash2, Calendar } from 'lucide-react';
import { useChallenges } from '../context/ChallengesContext';
import { Challenge, ChallengeStatus } from '../types';
import Modal from '../components/ui/Modal';
import ConfirmDialog from '../components/ui/ConfirmDialog';

function getDaysRemaining(endDate: string): number {
  const end = new Date(endDate + 'T00:00:00');
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function getTotalDays(startDate: string, endDate: string): number {
  const start = new Date(startDate + 'T00:00:00');
  const end = new Date(endDate + 'T00:00:00');
  return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
}

function getElapsedDays(startDate: string): number {
  const start = new Date(startDate + 'T00:00:00');
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.ceil((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
}

function formatDate(dateStr: string): string {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function ChallengesPage() {
  const { challenges, loading, createChallenge, updateChallenge, deleteChallenge } = useChallenges();
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deletingChallenge, setDeletingChallenge] = useState<Challenge | null>(null);

  const activeChallenges = useMemo(() => challenges.filter(c => c.status === 'active'), [challenges]);
  const pastChallenges = useMemo(() => challenges.filter(c => c.status !== 'active'), [challenges]);

  const handleCreate = async (name: string, endDate: string) => {
    const today = new Date();
    const startDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    await createChallenge({ name, start_date: startDate, end_date: endDate });
    setCreateOpen(false);
  };

  const handleStatus = async (id: string, status: ChallengeStatus) => {
    await updateChallenge(id, { status });
  };

  const handleDeleteConfirm = (challenge: Challenge) => {
    setDeletingChallenge(challenge);
    setDeleteConfirmOpen(true);
  };

  const handleDelete = async () => {
    if (deletingChallenge) {
      await deleteChallenge(deletingChallenge.id);
      setDeleteConfirmOpen(false);
      setDeletingChallenge(null);
    }
  };

  if (loading) {
    return <div className="text-[#7a7890] text-[14px] text-center pt-40">Loading...</div>;
  }

  if (challenges.length === 0) {
    return (
      <div className="max-w-[1200px] px-4 py-6 md:px-12 md:py-10">
        <div className="flex items-center gap-3 mb-1">
          <Trophy size={24} className="text-[#ec4899]" />
          <h1 className="text-[26px] font-bold text-white leading-tight">Challenges</h1>
        </div>
        <p className="text-[14px] text-[#7a7890] mt-2 mb-8">
          Set personal challenges and track your progress.
        </p>

        <div className="flex flex-col items-center justify-center py-20 rounded-xl bg-[#0f0d18] border border-[#1c1928]">
          <Trophy size={40} className="text-[#4a4660] mb-4" />
          <p className="text-[15px] text-[#7a7890] mb-4">No challenges yet</p>
          <button
            onClick={() => setCreateOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 text-[13px] font-medium text-white bg-[#ec4899] hover:bg-[#db2777] rounded-full transition-colors"
          >
            <Plus size={16} />
            New Challenge
          </button>
        </div>

        <CreateChallengeModal open={createOpen} onClose={() => setCreateOpen(false)} onSave={handleCreate} />
      </div>
    );
  }

  return (
    <div className="max-w-[1200px] px-4 py-6 md:px-12 md:py-10">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Trophy size={24} className="text-[#ec4899]" />
          <div>
            <h1 className="text-[26px] font-bold text-white leading-tight">Challenges</h1>
            <p className="text-[14px] text-[#7a7890] mt-1">
              {activeChallenges.length} active
            </p>
          </div>
        </div>
        <button
          onClick={() => setCreateOpen(true)}
          className="flex items-center gap-2 px-4 py-2 text-[13px] font-medium text-white bg-[#ec4899] hover:bg-[#db2777] rounded-full transition-colors"
        >
          <Plus size={16} />
          New Challenge
        </button>
      </div>

      {/* Active challenges */}
      {activeChallenges.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8">
          {activeChallenges.map(challenge => (
            <ChallengeCard
              key={challenge.id}
              challenge={challenge}
              onComplete={() => handleStatus(challenge.id, 'completed')}
              onFail={() => handleStatus(challenge.id, 'failed')}
              onDelete={() => handleDeleteConfirm(challenge)}
            />
          ))}
        </div>
      )}

      {/* Past challenges */}
      {pastChallenges.length > 0 && (
        <>
          <h2 className="text-[13px] font-medium text-[#7a7890] uppercase tracking-wider mb-4">Past Challenges</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {pastChallenges.map(challenge => (
              <ChallengeCard
                key={challenge.id}
                challenge={challenge}
                onDelete={() => handleDeleteConfirm(challenge)}
              />
            ))}
          </div>
        </>
      )}

      <CreateChallengeModal open={createOpen} onClose={() => setCreateOpen(false)} onSave={handleCreate} />

      <ConfirmDialog
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={handleDelete}
        title="Delete challenge?"
        message={`This will permanently remove "${deletingChallenge?.name}".`}
        confirmLabel="Delete"
      />
    </div>
  );
}

function ChallengeCard({ challenge, onComplete, onFail, onDelete }: {
  challenge: Challenge;
  onComplete?: () => void;
  onFail?: () => void;
  onDelete: () => void;
}) {
  const isActive = challenge.status === 'active';
  const daysRemaining = getDaysRemaining(challenge.end_date);
  const totalDays = getTotalDays(challenge.start_date, challenge.end_date);
  const elapsedDays = getElapsedDays(challenge.start_date);
  const progress = totalDays > 0 ? Math.min(Math.max(elapsedDays / totalDays, 0), 1) : 0;

  return (
    <div className={`rounded-xl border p-5 transition-colors ${
      isActive
        ? 'bg-[#13111c] border-[#1c1928] hover:border-[#2d2a40]'
        : 'bg-[#0f0d18] border-[#1c1928] opacity-60'
    }`}>
      {/* Name */}
      <h3 className="text-[15px] font-medium text-white mb-3 leading-snug">{challenge.name}</h3>

      {/* Countdown or badge */}
      {isActive ? (
        <div className="mb-3">
          <span className="text-[36px] font-bold text-[#ec4899] leading-none">
            {Math.max(daysRemaining, 0)}
          </span>
          <span className="text-[13px] text-[#7a7890] ml-2">
            {daysRemaining === 1 ? 'day left' : 'days left'}
          </span>
        </div>
      ) : (
        <div className="mb-3">
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[12px] font-medium ${
            challenge.status === 'completed'
              ? 'bg-emerald-500/10 text-emerald-400'
              : 'bg-red-500/10 text-red-400'
          }`}>
            {challenge.status === 'completed' ? <Check size={12} /> : <X size={12} />}
            {challenge.status === 'completed' ? 'Completed' : 'Failed'}
          </span>
        </div>
      )}

      {/* Progress bar */}
      <div className="h-1.5 rounded-full bg-white/[0.06] mb-3 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${
            challenge.status === 'completed' ? 'bg-emerald-500' :
            challenge.status === 'failed' ? 'bg-red-400' :
            'bg-[#ec4899]'
          }`}
          style={{ width: `${(isActive ? progress : 1) * 100}%` }}
        />
      </div>

      {/* Date range */}
      <div className="flex items-center gap-1.5 text-[12px] text-[#7a7890] mb-4">
        <Calendar size={12} />
        <span>{formatDate(challenge.start_date)} → {formatDate(challenge.end_date)}</span>
        <span className="ml-auto">{totalDays} days</span>
      </div>

      {/* Actions */}
      {isActive && (
        <div className="flex items-center gap-2">
          <button
            onClick={onComplete}
            title="Mark completed"
            className="p-2 rounded-lg text-[#7a7890] hover:text-emerald-400 hover:bg-emerald-400/10 transition-colors"
          >
            <Check size={16} />
          </button>
          <button
            onClick={onFail}
            title="Mark failed"
            className="p-2 rounded-lg text-[#7a7890] hover:text-red-400 hover:bg-red-400/10 transition-colors"
          >
            <X size={16} />
          </button>
          <div className="flex-1" />
          <button
            onClick={onDelete}
            title="Delete"
            className="p-2 rounded-lg text-[#7a7890] hover:text-red-400 hover:bg-red-400/10 transition-colors"
          >
            <Trash2 size={14} />
          </button>
        </div>
      )}
      {!isActive && (
        <div className="flex justify-end">
          <button
            onClick={onDelete}
            title="Delete"
            className="p-2 rounded-lg text-[#7a7890] hover:text-red-400 hover:bg-red-400/10 transition-colors"
          >
            <Trash2 size={14} />
          </button>
        </div>
      )}
    </div>
  );
}

function CreateChallengeModal({ open, onClose, onSave }: {
  open: boolean;
  onClose: () => void;
  onSave: (name: string, endDate: string) => Promise<void>;
}) {
  const [name, setName] = useState('');
  const [endDate, setEndDate] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !endDate) return;
    setSaving(true);
    try {
      await onSave(name.trim(), endDate);
      setName('');
      setEndDate('');
    } finally {
      setSaving(false);
    }
  };

  const today = new Date();
  const minDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate() + 1).padStart(2, '0')}`;

  return (
    <Modal open={open} onClose={onClose}>
      <form onSubmit={handleSubmit} className="p-6">
        <div className="flex items-center gap-2.5 mb-5">
          <Trophy size={18} className="text-[#ec4899]" />
          <h2 className="text-[16px] font-semibold text-white">New Challenge</h2>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-[13px] text-[#7a7890] mb-1.5">Challenge name</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g., No sweets for 30 days"
              className="w-full px-4 py-2.5 bg-[#0c0a12] border border-[#1c1928] rounded-lg text-[14px] text-[#e0dfe4] placeholder-[#4a4660] outline-none focus:border-[#2d2a40] transition-colors"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-[13px] text-[#7a7890] mb-1.5">End date</label>
            <input
              type="date"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              min={minDate}
              className="w-full px-4 py-2.5 bg-[#0c0a12] border border-[#1c1928] rounded-lg text-[14px] text-[#e0dfe4] outline-none focus:border-[#2d2a40] transition-colors [color-scheme:dark]"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2.5 mt-6">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-[13px] text-[#7a7890] hover:text-white rounded-lg hover:bg-white/[0.04] transition-all"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!name.trim() || !endDate || saving}
            className="px-5 py-2 text-[13px] bg-[#ec4899] hover:bg-[#db2777] text-white font-medium rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Creating...' : 'Create Challenge'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
