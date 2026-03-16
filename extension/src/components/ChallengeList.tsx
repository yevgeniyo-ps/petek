import { useState } from 'react';
import { useChallenges } from '@shared/context/ChallengesContext';
import { Plus, Check, X, Trash2, CalendarPlus } from 'lucide-react';
import { ChallengeStatus } from '@shared/types';

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

export function ChallengeList() {
  const { challenges, loading, createChallenge, updateChallenge, deleteChallenge } = useChallenges();
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');
  const [endDate, setEndDate] = useState('');
  const [saving, setSaving] = useState(false);

  const activeChallenges = challenges.filter(c => c.status === 'active');
  const pastChallenges = challenges.filter(c => c.status !== 'active');

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !endDate) return;
    setSaving(true);
    try {
      const today = new Date();
      const startDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      await createChallenge({ name: name.trim(), start_date: startDate, end_date: endDate });
      setName('');
      setEndDate('');
      setCreating(false);
    } finally {
      setSaving(false);
    }
  };

  const handleStatus = async (id: string, status: ChallengeStatus) => {
    await updateChallenge(id, { status });
  };

  if (loading) {
    return <div className="text-[#7a7890] text-xs text-center py-8">Loading...</div>;
  }

  const today = new Date();
  const minDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate() + 1).padStart(2, '0')}`;

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Create button */}
      <div className="px-4 pt-3 pb-2">
        {!creating ? (
          <button
            onClick={() => setCreating(true)}
            className="w-full flex items-center justify-center gap-1.5 py-2 text-xs font-medium text-[#ec4899] hover:bg-[#ec4899]/10 rounded-lg transition-colors"
          >
            <Plus size={14} />
            New Challenge
          </button>
        ) : (
          <form onSubmit={handleCreate} className="space-y-2">
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Challenge name..."
              className="w-full px-3 py-2 bg-[#0c0a12] border border-[#1c1928] rounded-lg text-xs text-[#e0dfe4] placeholder-[#4a4660] outline-none focus:border-[#2d2a40]"
              autoFocus
            />
            <input
              type="date"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              min={minDate}
              className="w-full px-3 py-2 bg-[#0c0a12] border border-[#1c1928] rounded-lg text-xs text-[#e0dfe4] outline-none focus:border-[#2d2a40] [color-scheme:dark]"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => { setCreating(false); setName(''); setEndDate(''); }}
                className="flex-1 py-1.5 text-xs text-[#7a7890] hover:text-white rounded-lg hover:bg-white/5 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!name.trim() || !endDate || saving}
                className="flex-1 py-1.5 text-xs font-medium text-white bg-[#ec4899] hover:bg-[#db2777] rounded-lg transition-colors disabled:opacity-50"
              >
                {saving ? '...' : 'Create'}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Active challenges */}
      <div className="px-4 space-y-2">
        {activeChallenges.map(challenge => {
          const daysRemaining = getDaysRemaining(challenge.end_date);
          const totalDays = getTotalDays(challenge.start_date, challenge.end_date);
          const elapsed = getElapsedDays(challenge.start_date);
          const progress = totalDays > 0 ? Math.min(Math.max(elapsed / totalDays, 0), 1) : 0;

          return (
            <ExtChallengeCard
              key={challenge.id}
              challenge={challenge}
              daysRemaining={daysRemaining}
              progress={progress}
              onComplete={() => handleStatus(challenge.id, 'completed')}
              onFail={() => handleStatus(challenge.id, 'failed')}
              onExtend={(newEnd) => updateChallenge(challenge.id, { end_date: newEnd })}
              onDelete={() => deleteChallenge(challenge.id)}
            />
          );
        })}
      </div>

      {/* Past challenges */}
      {pastChallenges.length > 0 && (
        <div className="px-4 mt-4">
          <div className="text-[10px] font-medium text-[#7a7890] uppercase tracking-wider mb-2">Past</div>
          <div className="space-y-1.5">
            {pastChallenges.map(challenge => (
              <div key={challenge.id} className="flex items-center gap-2 px-3 py-2 bg-[#0f0d18] border border-[#1c1928] rounded-lg opacity-60">
                <span className={`text-[11px] font-medium px-1.5 py-0.5 rounded ${
                  challenge.status === 'completed'
                    ? 'bg-emerald-500/10 text-emerald-400'
                    : 'bg-red-500/10 text-red-400'
                }`}>
                  {challenge.status === 'completed' ? 'Done' : 'Failed'}
                </span>
                <span className="text-[12px] text-[#7a7890] truncate flex-1">{challenge.name}</span>
                <button
                  onClick={() => deleteChallenge(challenge.id)}
                  className="p-1 rounded text-[#7a7890] hover:text-red-400 transition-colors shrink-0"
                >
                  <Trash2 size={11} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {challenges.length === 0 && (
        <div className="text-center py-8 text-[#7a7890] text-xs">
          No challenges yet. Create one to get started!
        </div>
      )}
    </div>
  );
}

function formatDate(dateStr: string): string {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

import { Challenge } from '@shared/types';

function ExtChallengeCard({ challenge, daysRemaining, progress, onComplete, onFail, onExtend, onDelete }: {
  challenge: Challenge;
  daysRemaining: number;
  progress: number;
  onComplete: () => void;
  onFail: () => void;
  onExtend: (newEndDate: string) => void;
  onDelete: () => void;
}) {
  const [extending, setExtending] = useState(false);
  const [newEndDate, setNewEndDate] = useState(challenge.end_date);

  const handleExtend = () => {
    if (newEndDate && newEndDate > challenge.end_date) {
      onExtend(newEndDate);
      setExtending(false);
    }
  };

  return (
    <div className="bg-[#13111c] border border-[#1c1928] rounded-lg p-3">
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <span className="text-[13px] text-white font-medium leading-snug">{challenge.name}</span>
        <span className="text-[18px] font-bold text-[#ec4899] leading-none shrink-0">
          {Math.max(daysRemaining, 0)}d
        </span>
      </div>
      <div className="text-[10px] text-[#7a7890] mb-2">
        Started {formatDate(challenge.start_date)} · Ends {formatDate(challenge.end_date)}
      </div>
      <div className="h-1 rounded-full bg-white/[0.06] mb-2 overflow-hidden">
        <div className="h-full rounded-full bg-[#ec4899]" style={{ width: `${progress * 100}%` }} />
      </div>
      {extending && (
        <div className="flex items-center gap-1.5 mb-2">
          <input
            type="date"
            value={newEndDate}
            onChange={e => setNewEndDate(e.target.value)}
            min={challenge.end_date}
            className="flex-1 px-2 py-1 bg-[#0c0a12] border border-[#1c1928] rounded text-[11px] text-[#e0dfe4] outline-none focus:border-[#2d2a40] [color-scheme:dark]"
          />
          <button
            onClick={handleExtend}
            disabled={!newEndDate || newEndDate <= challenge.end_date}
            className="px-2 py-1 text-[11px] font-medium text-white bg-[#ec4899] hover:bg-[#db2777] rounded transition-colors disabled:opacity-50"
          >
            Save
          </button>
          <button
            onClick={() => { setExtending(false); setNewEndDate(challenge.end_date); }}
            className="px-1 py-1 text-[11px] text-[#7a7890] hover:text-white transition-colors"
          >
            Cancel
          </button>
        </div>
      )}
      <div className="flex items-center gap-1">
        <button
          onClick={onComplete}
          title="Complete"
          className="p-1 rounded text-[#7a7890] hover:text-emerald-400 hover:bg-emerald-400/10 transition-colors"
        >
          <Check size={13} />
        </button>
        <button
          onClick={onFail}
          title="Failed"
          className="p-1 rounded text-[#7a7890] hover:text-red-400 hover:bg-red-400/10 transition-colors"
        >
          <X size={13} />
        </button>
        <button
          onClick={() => { setExtending(!extending); setNewEndDate(challenge.end_date); }}
          title="Extend"
          className="p-1 rounded text-[#7a7890] hover:text-[#ec4899] hover:bg-[#ec4899]/10 transition-colors"
        >
          <CalendarPlus size={13} />
        </button>
        <div className="flex-1" />
        <button
          onClick={onDelete}
          title="Delete"
          className="p-1 rounded text-[#7a7890] hover:text-red-400 hover:bg-red-400/10 transition-colors"
        >
          <Trash2 size={12} />
        </button>
      </div>
    </div>
  );
}
