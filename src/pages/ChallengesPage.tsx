import { useState, useMemo, useRef, useEffect } from 'react';
import { Trophy, Plus, Check, X, Trash2, CalendarPlus, Pencil } from 'lucide-react';
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

function getDateRange(startDate: string, endDate: string): string[] {
  const dates: string[] = [];
  const current = new Date(startDate + 'T00:00:00');
  const end = new Date(endDate + 'T00:00:00');
  while (current <= end) {
    const y = current.getFullYear();
    const m = String(current.getMonth() + 1).padStart(2, '0');
    const d = String(current.getDate()).padStart(2, '0');
    dates.push(`${y}-${m}-${d}`);
    current.setDate(current.getDate() + 1);
  }
  return dates;
}

function getTodayStr(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
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

      {/* Today check-in */}
      {activeChallenges.length > 0 && (
        <TodayCheckin challenges={activeChallenges} onToggleDay={(id, day) => {
          const challenge = activeChallenges.find(c => c.id === id)!;
          const failedDays = challenge.failed_days || [];
          const newFailedDays = failedDays.includes(day)
            ? failedDays.filter(d => d !== day)
            : [...failedDays, day];
          updateChallenge(id, { failed_days: newFailedDays });
        }} />
      )}

      {/* Active challenges */}
      {activeChallenges.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8">
          {activeChallenges.map(challenge => (
            <ChallengeCard
              key={challenge.id}
              challenge={challenge}
              onComplete={() => handleStatus(challenge.id, 'completed')}
              onFail={() => handleStatus(challenge.id, 'failed')}
              onExtend={(newEndDate) => updateChallenge(challenge.id, { end_date: newEndDate })}
              onDelete={() => handleDeleteConfirm(challenge)}
              onRename={(name) => updateChallenge(challenge.id, { name })}
              onToggleDay={(day) => {
                const failedDays = challenge.failed_days || [];
                const newFailedDays = failedDays.includes(day)
                  ? failedDays.filter(d => d !== day)
                  : [...failedDays, day];
                updateChallenge(challenge.id, { failed_days: newFailedDays });
              }}
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

function TodayCheckin({ challenges, onToggleDay }: {
  challenges: Challenge[];
  onToggleDay: (id: string, day: string) => void;
}) {
  const today = getTodayStr();
  const date = new Date(today + 'T00:00:00');
  const label = date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

  return (
    <div className="mb-6 rounded-xl border border-[#1c1928] bg-[#13111c] p-4">
      <div className="text-[13px] text-[#7a7890] mb-3">Today, {label}</div>
      <div className="flex flex-col gap-2">
        {challenges.map(c => {
          const failed = (c.failed_days || []).includes(today);
          return (
            <button
              key={c.id}
              onClick={() => onToggleDay(c.id, today)}
              className="flex items-center gap-3 group text-left"
            >
              <span className={`w-5 h-5 rounded flex-shrink-0 transition-colors ${
                failed ? 'bg-[#1a1826]' : 'bg-[#ec4899]'
              }`} />
              <span className={`text-[14px] transition-colors ${
                failed ? 'text-[#4a4660] line-through' : 'text-white'
              }`}>{c.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ChallengeCard({ challenge, onComplete, onFail, onDelete, onExtend, onRename, onToggleDay }: {
  challenge: Challenge;
  onComplete?: () => void;
  onFail?: () => void;
  onDelete: () => void;
  onExtend?: (newEndDate: string) => void;
  onRename?: (name: string) => void;
  onToggleDay?: (day: string) => void;
}) {
  const isActive = challenge.status === 'active';
  const daysRemaining = getDaysRemaining(challenge.end_date);
  const totalDays = getTotalDays(challenge.start_date, challenge.end_date);
  const [extending, setExtending] = useState(false);
  const [newEndDate, setNewEndDate] = useState(challenge.end_date);
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(challenge.name);
  const editRef = useRef<HTMLInputElement>(null);
  const days = useMemo(() => getDateRange(challenge.start_date, challenge.end_date), [challenge.start_date, challenge.end_date]);
  const today = getTodayStr();
  const failedDays = challenge.failed_days || [];

  useEffect(() => {
    if (editing) editRef.current?.focus();
  }, [editing]);

  const handleRename = () => {
    const trimmed = editName.trim();
    if (trimmed && trimmed !== challenge.name) onRename?.(trimmed);
    else setEditName(challenge.name);
    setEditing(false);
  };

  const handleExtend = () => {
    if (newEndDate && newEndDate > challenge.end_date && onExtend) {
      onExtend(newEndDate);
      setExtending(false);
    }
  };

  return (
    <div className={`rounded-xl border p-5 transition-colors ${
      isActive
        ? 'bg-[#13111c] border-[#1c1928] hover:border-[#2d2a40]'
        : 'bg-[#0f0d18] border-[#1c1928] opacity-60'
    }`}>
      {/* Name */}
      {editing ? (
        <input
          ref={editRef}
          value={editName}
          onChange={e => setEditName(e.target.value)}
          onBlur={handleRename}
          onKeyDown={e => {
            if (e.key === 'Enter') handleRename();
            if (e.key === 'Escape') { setEditName(challenge.name); setEditing(false); }
          }}
          className="w-full text-[15px] font-medium text-white mb-3 leading-snug bg-transparent border-b border-[#2d2a40] outline-none"
        />
      ) : (
        <div className="flex items-start gap-2 mb-3 group">
          <h3 className="text-[15px] font-medium text-white leading-snug flex-1">{challenge.name}</h3>
          {isActive && onRename && (
            <button
              onClick={() => { setEditName(challenge.name); setEditing(true); }}
              className="p-1 rounded-lg text-[#7a7890] opacity-0 group-hover:opacity-100 hover:text-white transition-all shrink-0"
              title="Edit name"
            >
              <Pencil size={12} />
            </button>
          )}
        </div>
      )}

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

      {/* GitHub-style day grid */}
      {(() => {
        // Build grid: columns = weeks, rows = day-of-week (0=Sun..6=Sat)
        const firstDate = new Date(days[0] + 'T00:00:00');
        const firstDow = firstDate.getDay(); // 0=Sun
        // Pad start so first day lands in correct row
        const padded: (string | null)[] = Array(firstDow).fill(null).concat(days);
        const numCols = Math.ceil(padded.length / 7);
        // Fill remainder
        while (padded.length < numCols * 7) padded.push(null);

        return (
          <div className="flex gap-[3px] mb-3">
            {Array.from({ length: numCols }, (_, col) => (
              <div key={col} className="flex flex-col gap-[3px]">
                {Array.from({ length: 7 }, (_, row) => {
                  const day = padded[col * 7 + row];
                  if (!day) return <div key={row} className="w-[10px] h-[10px]" />;

                  const isFailed = failedDays.includes(day);
                  const isToday = day === today;
                  const isPast = day < today;
                  const clickable = (isPast || isToday) && isActive;

                  let color: string;
                  if (!isActive) {
                    color = 'bg-[#2a2835]';
                  } else if (isFailed) {
                    color = 'bg-[#1a1826]';
                  } else if (isPast || isToday) {
                    color = 'bg-[#ec4899]';
                  } else {
                    color = 'bg-white/[0.15]';
                  }

                  return (
                    <button
                      key={row}
                      onClick={clickable ? () => onToggleDay?.(day) : undefined}
                      disabled={!clickable}
                      title={formatDate(day)}
                      className={`w-[10px] h-[10px] rounded-[2px] transition-colors ${color} ${
                        isToday ? 'ring-[1.5px] ring-white' : ''
                      } ${clickable ? 'cursor-pointer hover:opacity-80' : 'cursor-default'}`}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        );
      })()}

      {/* Date details */}
      <div className="text-[11px] text-[#4a4660] mb-4">
        {formatDate(challenge.start_date)} – {formatDate(challenge.end_date)} · {totalDays}d
      </div>

      {/* Extend inline */}
      {extending && (
        <div className="flex items-center gap-2 mb-3">
          <input
            type="date"
            value={newEndDate}
            onChange={e => setNewEndDate(e.target.value)}
            min={challenge.end_date}
            className="flex-1 px-3 py-1.5 bg-[#0c0a12] border border-[#1c1928] rounded-lg text-[12px] text-[#e0dfe4] outline-none focus:border-[#2d2a40] [color-scheme:dark]"
          />
          <button
            onClick={handleExtend}
            disabled={!newEndDate || newEndDate <= challenge.end_date}
            className="px-3 py-1.5 text-[12px] font-medium text-white bg-[#ec4899] hover:bg-[#db2777] rounded-lg transition-colors disabled:opacity-50"
          >
            Save
          </button>
          <button
            onClick={() => { setExtending(false); setNewEndDate(challenge.end_date); }}
            className="px-2 py-1.5 text-[12px] text-[#7a7890] hover:text-white transition-colors"
          >
            Cancel
          </button>
        </div>
      )}

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
          <button
            onClick={() => { setExtending(!extending); setNewEndDate(challenge.end_date); }}
            title="Extend challenge"
            className="p-2 rounded-lg text-[#7a7890] hover:text-[#ec4899] hover:bg-[#ec4899]/10 transition-colors"
          >
            <CalendarPlus size={16} />
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
