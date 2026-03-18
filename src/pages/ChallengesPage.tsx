import { useState, useMemo, useRef, useEffect } from 'react';
import { Trophy, Plus, Check, X, Trash2, CalendarPlus, Pencil, Flame, Share2, Users, Copy, LogOut, UserPlus } from 'lucide-react';
import { useChallenges } from '../context/ChallengesContext';
import { useAuth } from '../context/AuthContext';
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

function getStreak(failedDays: string[], startDate: string, today: string): number {
  const start = new Date(startDate + 'T00:00:00');
  const cur = new Date(today + 'T00:00:00');
  let streak = 0;
  while (cur >= start) {
    const y = cur.getFullYear();
    const m = String(cur.getMonth() + 1).padStart(2, '0');
    const d = String(cur.getDate()).padStart(2, '0');
    const dayStr = `${y}-${m}-${d}`;
    if (failedDays.includes(dayStr)) break;
    streak++;
    cur.setDate(cur.getDate() - 1);
  }
  return streak;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function getMyFailedDays(challenge: Challenge, userId: string): string[] {
  if (challenge.invite_code && challenge.participants) {
    const me = challenge.participants.find(p => p.user_id === userId);
    return me?.failed_days || [];
  }
  return challenge.failed_days || [];
}

function getParticipantLabel(displayName: string, email: string): string {
  const name = displayName || email.split('@')[0] || email;
  return displayName ? `${name} (${email})` : name;
}

export default function ChallengesPage() {
  const { user } = useAuth();
  const { challenges, loading, createChallenge, updateChallenge, deleteChallenge, generateInviteCode, joinChallenge, toggleFailedDay, leaveChallenge } = useChallenges();
  const [createOpen, setCreateOpen] = useState(false);
  const [joinOpen, setJoinOpen] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deletingChallenge, setDeletingChallenge] = useState<Challenge | null>(null);
  const [leaveConfirmOpen, setLeaveConfirmOpen] = useState(false);
  const [leavingChallenge, setLeavingChallenge] = useState<Challenge | null>(null);

  // Handle ?join=CODE query param
  useEffect(() => {
    const hash = window.location.hash;
    const match = hash.match(/[?&]join=([A-Za-z0-9]+)/);
    if (match?.[1]) {
      setJoinCode(match[1]);
      setJoinOpen(true);
      // Clean up the URL
      window.location.hash = hash.replace(/[?&]join=[A-Za-z0-9]+/, '');
    }
  }, []);

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

  const handleLeaveConfirm = (challenge: Challenge) => {
    setLeavingChallenge(challenge);
    setLeaveConfirmOpen(true);
  };

  const handleLeave = async () => {
    if (leavingChallenge) {
      await leaveChallenge(leavingChallenge.id);
      setLeaveConfirmOpen(false);
      setLeavingChallenge(null);
    }
  };

  const handleJoin = async (code: string) => {
    await joinChallenge(code);
    setJoinOpen(false);
    setJoinCode('');
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
          <div className="flex gap-2">
            <button
              onClick={() => setCreateOpen(true)}
              className="flex items-center gap-2 px-5 py-2.5 text-[13px] font-medium text-white bg-[#ec4899] hover:bg-[#db2777] rounded-full transition-colors"
            >
              <Plus size={16} />
              New Challenge
            </button>
            <button
              onClick={() => setJoinOpen(true)}
              className="flex items-center gap-2 px-5 py-2.5 text-[13px] font-medium text-[#7a7890] hover:text-white bg-white/[0.04] hover:bg-white/[0.08] rounded-full transition-colors"
            >
              <UserPlus size={16} />
              Join
            </button>
          </div>
        </div>

        <CreateChallengeModal open={createOpen} onClose={() => setCreateOpen(false)} onSave={handleCreate} />
        <JoinChallengeModal open={joinOpen} onClose={() => { setJoinOpen(false); setJoinCode(''); }} onJoin={handleJoin} initialCode={joinCode} />
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
        <div className="flex gap-2">
          <button
            onClick={() => setJoinOpen(true)}
            className="flex items-center gap-2 px-4 py-2 text-[13px] font-medium text-[#7a7890] hover:text-white bg-white/[0.04] hover:bg-white/[0.08] rounded-full transition-colors"
          >
            <UserPlus size={16} />
            Join
          </button>
          <button
            onClick={() => setCreateOpen(true)}
            className="flex items-center gap-2 px-4 py-2 text-[13px] font-medium text-white bg-[#ec4899] hover:bg-[#db2777] rounded-full transition-colors"
          >
            <Plus size={16} />
            New Challenge
          </button>
        </div>
      </div>

      {/* Today check-in */}
      {activeChallenges.length > 0 && user && (
        <TodayCheckin
          challenges={activeChallenges}
          userId={user.id}
          onToggleDay={(id, day) => toggleFailedDay(id, day)}
        />
      )}

      {/* Active challenges */}
      {activeChallenges.length > 0 && user && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8">
          {activeChallenges.map(challenge => (
            <ChallengeCard
              key={challenge.id}
              challenge={challenge}
              userId={user.id}
              onComplete={challenge.user_id === user.id ? () => handleStatus(challenge.id, 'completed') : undefined}
              onFail={challenge.user_id === user.id ? () => handleStatus(challenge.id, 'failed') : undefined}
              onExtend={challenge.user_id === user.id ? (newEndDate) => updateChallenge(challenge.id, { end_date: newEndDate }) : undefined}
              onDelete={challenge.user_id === user.id ? () => handleDeleteConfirm(challenge) : undefined}
              onRename={challenge.user_id === user.id ? (name) => updateChallenge(challenge.id, { name }) : undefined}
              onToggleDay={(day) => toggleFailedDay(challenge.id, day)}
              onShare={challenge.user_id === user.id ? () => generateInviteCode(challenge.id) : undefined}
              onLeave={challenge.user_id !== user.id ? () => handleLeaveConfirm(challenge) : undefined}
            />
          ))}
        </div>
      )}

      {/* Past challenges */}
      {pastChallenges.length > 0 && user && (
        <>
          <h2 className="text-[13px] font-medium text-[#7a7890] uppercase tracking-wider mb-4">Past Challenges</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {pastChallenges.map(challenge => (
              <ChallengeCard
                key={challenge.id}
                challenge={challenge}
                userId={user.id}
                onDelete={challenge.user_id === user.id ? () => handleDeleteConfirm(challenge) : undefined}
                onLeave={challenge.user_id !== user.id ? () => handleLeaveConfirm(challenge) : undefined}
              />
            ))}
          </div>
        </>
      )}

      <CreateChallengeModal open={createOpen} onClose={() => setCreateOpen(false)} onSave={handleCreate} />
      <JoinChallengeModal open={joinOpen} onClose={() => { setJoinOpen(false); setJoinCode(''); }} onJoin={handleJoin} initialCode={joinCode} />

      <ConfirmDialog
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={handleDelete}
        title="Delete challenge?"
        message={`This will permanently remove "${deletingChallenge?.name}".`}
        confirmLabel="Delete"
      />

      <ConfirmDialog
        open={leaveConfirmOpen}
        onClose={() => setLeaveConfirmOpen(false)}
        onConfirm={handleLeave}
        title="Leave challenge?"
        message={`You will no longer see "${leavingChallenge?.name}". Your progress will be removed.`}
        confirmLabel="Leave"
      />
    </div>
  );
}

function TodayCheckin({ challenges, userId, onToggleDay }: {
  challenges: Challenge[];
  userId: string;
  onToggleDay: (id: string, day: string) => void;
}) {
  const today = getTodayStr();
  const date = new Date(today + 'T00:00:00');
  const label = date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

  return (
    <div className="mb-6 rounded-xl border border-[#1c1928] bg-[#13111c] p-5">
      <div className="text-[13px] text-[#7a7890] mb-4">Today, {label}</div>
      <div className="flex flex-col gap-3">
        {challenges.map(c => {
          const myFailedDays = getMyFailedDays(c, userId);
          const isFailed = myFailedDays.includes(today);
          const streak = getStreak(myFailedDays, c.start_date, today);
          return (
            <button
              key={c.id}
              onClick={() => onToggleDay(c.id, today)}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all ${
                isFailed
                  ? 'bg-amber-400/[0.06] hover:bg-amber-400/[0.1]'
                  : 'bg-[#ec4899]/[0.06] hover:bg-[#ec4899]/[0.1]'
              }`}
            >
              <span className={`w-5 h-5 rounded flex-shrink-0 transition-colors ${
                isFailed ? 'bg-amber-400' : 'bg-[#ec4899]'
              }`} />
              <span className={`text-[14px] truncate flex-1 text-left transition-colors ${
                isFailed ? 'text-amber-400/80' : 'text-white'
              }`}>{c.name}</span>
              {c.invite_code && (
                <span className="text-[#4a4660]"><Users size={13} /></span>
              )}
              {streak >= 3 && (
                <span className="flex items-center gap-0.5 text-[12px] text-[#ec4899] font-medium shrink-0">
                  <Flame size={13} />
                  {streak}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function DayGrid({ days, failedDays, today, isActive, clickable, onToggleDay, joinedAt }: {
  days: string[];
  failedDays: string[];
  today: string;
  isActive: boolean;
  clickable: boolean;
  onToggleDay?: (day: string) => void;
  joinedAt?: string;
}) {
  // Date the participant joined (days before this are not tracked)
  const joinDate = joinedAt ? joinedAt.slice(0, 10) : null;
  const firstDate = new Date(days[0] + 'T00:00:00');
  const firstDow = firstDate.getDay();
  const padded: (string | null)[] = Array(firstDow).fill(null).concat(days);
  const numCols = Math.ceil(padded.length / 7);
  while (padded.length < numCols * 7) padded.push(null);

  return (
    <div className="flex gap-[3px] overflow-x-auto p-[2px]">
      {Array.from({ length: numCols }, (_, col) => (
        <div key={col} className="flex flex-col gap-[3px]">
          {Array.from({ length: 7 }, (_, row) => {
            const day = padded[col * 7 + row];
            if (!day) return <div key={row} className="w-[10px] h-[10px]" />;

            const isFailed = failedDays.includes(day);
            const isToday = day === today;
            const isPast = day < today;
            const isBeforeJoin = joinDate ? day < joinDate : false;
            const canClick = clickable && (isPast || isToday) && isActive && !isBeforeJoin;

            let color: string;
            let style: React.CSSProperties | undefined;
            if (!isActive) {
              color = 'bg-[#2a2835]';
            } else if (isBeforeJoin) {
              color = 'bg-[#1c1928]';
              style = {
                backgroundImage: 'repeating-linear-gradient(135deg, transparent, transparent 2px, rgba(255,255,255,0.07) 2px, rgba(255,255,255,0.07) 3px)',
              };
            } else if (isFailed) {
              color = 'bg-amber-400';
            } else if (isPast || isToday) {
              color = 'bg-[#ec4899]';
            } else {
              color = 'bg-white/[0.15]';
            }

            return (
              <button
                key={row}
                onClick={canClick ? () => onToggleDay?.(day) : undefined}
                disabled={!canClick}
                title={isBeforeJoin ? `${formatDate(day)} (before join)` : formatDate(day)}
                style={style}
                className={`w-[10px] h-[10px] rounded-[2px] transition-colors ${color} ${
                  isToday ? 'ring-[1.5px] ring-white' : ''
                } ${canClick ? 'cursor-pointer hover:opacity-80' : 'cursor-default'}`}
              />
            );
          })}
        </div>
      ))}
    </div>
  );
}

function ChallengeCard({ challenge, userId, onComplete, onFail, onDelete, onExtend, onRename, onToggleDay, onShare, onLeave }: {
  challenge: Challenge;
  userId: string;
  onComplete?: () => void;
  onFail?: () => void;
  onDelete?: () => void;
  onExtend?: (newEndDate: string) => void;
  onRename?: (name: string) => void;
  onToggleDay?: (day: string) => void;
  onShare?: () => Promise<string>;
  onLeave?: () => void;
}) {
  const isActive = challenge.status === 'active';
  const isOwner = challenge.user_id === userId;
  const isShared = !!challenge.invite_code;
  const daysRemaining = getDaysRemaining(challenge.end_date);
  const totalDays = getTotalDays(challenge.start_date, challenge.end_date);
  const [extending, setExtending] = useState(false);
  const [newEndDate, setNewEndDate] = useState(challenge.end_date);
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(challenge.name);
  const editRef = useRef<HTMLInputElement>(null);
  const days = useMemo(() => getDateRange(challenge.start_date, challenge.end_date), [challenge.start_date, challenge.end_date]);
  const today = getTodayStr();
  const [showInviteCode, setShowInviteCode] = useState(false);
  const [inviteCode, setInviteCode] = useState(challenge.invite_code || '');
  const [sharing, setSharing] = useState(false);
  const [copied, setCopied] = useState(false);

  const myFailedDays = getMyFailedDays(challenge, userId);

  useEffect(() => {
    if (editing) editRef.current?.focus();
  }, [editing]);

  useEffect(() => {
    if (challenge.invite_code) setInviteCode(challenge.invite_code);
  }, [challenge.invite_code]);

  const handleRename = () => {
    const trimmed = editName.trim();
    if (trimmed && trimmed !== challenge.name) onRename?.(trimmed);
    else setEditName(challenge.name);
    setEditing(false);
  };

  const handleExtend = () => {
    if (newEndDate && newEndDate !== challenge.end_date && newEndDate >= today && onExtend) {
      onExtend(newEndDate);
      setExtending(false);
    }
  };

  const handleShare = async () => {
    if (!onShare) return;
    setSharing(true);
    try {
      const code = await onShare();
      setInviteCode(code);
      setShowInviteCode(true);
    } finally {
      setSharing(false);
    }
  };

  const handleCopyCode = async () => {
    await navigator.clipboard.writeText(inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Find owner participant for "by" label
  const ownerParticipant = challenge.participants?.find(p => p.user_id === challenge.user_id);

  return (
    <div className={`rounded-xl border p-5 transition-colors min-w-0 ${
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
          {isShared && (
            <span className="flex items-center gap-1 text-[11px] text-[#4a4660] shrink-0 mt-0.5">
              <Users size={12} />
              {challenge.participants?.length || 0}
            </span>
          )}
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

      {/* "by owner" for joined challenges */}
      {!isOwner && ownerParticipant && (
        <div className="text-[11px] text-[#4a4660] mb-2">
          by {ownerParticipant.display_name || ownerParticipant.email}
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

      {/* Day grids */}
      {isShared && challenge.participants ? (
        <div className="space-y-2 mb-3">
          {/* Current user first */}
          {challenge.participants
            .slice()
            .sort((a, b) => (a.user_id === userId ? -1 : b.user_id === userId ? 1 : 0))
            .map(participant => (
              <div key={participant.id}>
                <div className="text-[10px] text-[#7a7890] mb-1 truncate">
                  {participant.user_id === userId ? 'You' : getParticipantLabel(participant.display_name, participant.email)}
                </div>
                <DayGrid
                  days={days}
                  failedDays={participant.failed_days || []}
                  today={today}
                  isActive={isActive}
                  clickable={participant.user_id === userId}
                  onToggleDay={participant.user_id === userId ? onToggleDay : undefined}
                  joinedAt={participant.user_id !== challenge.user_id ? participant.joined_at : undefined}
                />
              </div>
            ))}
          {/* Legend */}
          <div className="flex items-center gap-3 mt-1">
            <span className="flex items-center gap-1 text-[10px] text-[#4a4660]">
              <span className="w-[8px] h-[8px] rounded-[2px] bg-[#ec4899]" /> passed
            </span>
            <span className="flex items-center gap-1 text-[10px] text-[#4a4660]">
              <span className="w-[8px] h-[8px] rounded-[2px] bg-amber-400" /> failed
            </span>
            <span className="flex items-center gap-1 text-[10px] text-[#4a4660]">
              <span className="w-[8px] h-[8px] rounded-[2px] bg-white/[0.15]" /> upcoming
            </span>
            <span className="flex items-center gap-1 text-[10px] text-[#4a4660]">
              <span className="w-[8px] h-[8px] rounded-[2px] bg-[#1c1928]" style={{ backgroundImage: 'repeating-linear-gradient(135deg, transparent, transparent 2px, rgba(255,255,255,0.07) 2px, rgba(255,255,255,0.07) 3px)' }} /> before join
            </span>
          </div>
        </div>
      ) : (
        <div className="mb-3">
          <DayGrid
            days={days}
            failedDays={myFailedDays}
            today={today}
            isActive={isActive}
            clickable={true}
            onToggleDay={onToggleDay}
          />
        </div>
      )}

      {/* Date details + counters */}
      <div className="text-[11px] text-[#4a4660] mb-4">
        {formatDate(challenge.start_date)} – {formatDate(challenge.end_date)} · {totalDays}d
        {isActive && (() => {
          const elapsed = Math.max(0, Math.ceil((new Date(today + 'T00:00:00').getTime() - new Date(challenge.start_date + 'T00:00:00').getTime()) / (1000 * 60 * 60 * 24)) + 1);
          const failedCount = myFailedDays.filter(d => d >= challenge.start_date && d <= today).length;
          const passedCount = elapsed - failedCount;
          return (
            <span> (<span className="text-[#ec4899]">{passedCount}</span>/<span className="text-amber-400">{failedCount}</span>)</span>
          );
        })()}
      </div>

      {/* Invite code display */}
      {showInviteCode && inviteCode && (
        <div className="flex items-center gap-2 mb-3 p-2.5 rounded-lg bg-[#0c0a12] border border-[#1c1928]">
          <span className="text-[14px] font-mono font-medium text-white tracking-widest flex-1">{inviteCode}</span>
          <button
            onClick={handleCopyCode}
            className="flex items-center gap-1 px-2 py-1 text-[11px] text-[#7a7890] hover:text-white transition-colors"
          >
            <Copy size={12} />
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
      )}

      {/* Extend inline */}
      {extending && (
        <div className="flex items-center gap-2 mb-3">
          <input
            type="date"
            value={newEndDate}
            onChange={e => setNewEndDate(e.target.value)}
            min={today}
            className="flex-1 px-3 py-1.5 bg-[#0c0a12] border border-[#1c1928] rounded-lg text-[12px] text-[#e0dfe4] outline-none focus:border-[#2d2a40] [color-scheme:dark]"
          />
          <button
            onClick={handleExtend}
            disabled={!newEndDate || newEndDate === challenge.end_date || newEndDate < today}
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
      {isActive && isOwner && (
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
            title="Change end date"
            className="p-2 rounded-lg text-[#7a7890] hover:text-[#ec4899] hover:bg-[#ec4899]/10 transition-colors"
          >
            <CalendarPlus size={16} />
          </button>
          <button
            onClick={isShared ? () => setShowInviteCode(!showInviteCode) : handleShare}
            disabled={sharing}
            title={isShared ? 'Show invite code' : 'Share challenge'}
            className="p-2 rounded-lg text-[#7a7890] hover:text-[#ec4899] hover:bg-[#ec4899]/10 transition-colors"
          >
            <Share2 size={16} />
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
      {isActive && !isOwner && (
        <div className="flex justify-end">
          <button
            onClick={onLeave}
            title="Leave challenge"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] text-[#7a7890] hover:text-red-400 hover:bg-red-400/10 transition-colors"
          >
            <LogOut size={14} />
            Leave
          </button>
        </div>
      )}
      {!isActive && isOwner && (
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
      {!isActive && !isOwner && (
        <div className="flex justify-end">
          <button
            onClick={onLeave}
            title="Leave challenge"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] text-[#7a7890] hover:text-red-400 hover:bg-red-400/10 transition-colors"
          >
            <LogOut size={14} />
            Leave
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

function JoinChallengeModal({ open, onClose, onJoin, initialCode }: {
  open: boolean;
  onClose: () => void;
  onJoin: (code: string) => Promise<void>;
  initialCode?: string;
}) {
  const [code, setCode] = useState(initialCode || '');
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialCode) setCode(initialCode);
  }, [initialCode]);

  useEffect(() => {
    if (!open) { setCode(initialCode || ''); setError(''); }
  }, [open, initialCode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) return;
    setJoining(true);
    setError('');
    try {
      await onJoin(trimmed);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to join challenge');
    } finally {
      setJoining(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose}>
      <form onSubmit={handleSubmit} className="p-6">
        <div className="flex items-center gap-2.5 mb-5">
          <UserPlus size={18} className="text-[#ec4899]" />
          <h2 className="text-[16px] font-semibold text-white">Join Challenge</h2>
        </div>

        <div>
          <label className="block text-[13px] text-[#7a7890] mb-1.5">Invite code</label>
          <input
            type="text"
            value={code}
            onChange={e => setCode(e.target.value.toUpperCase().slice(0, 6))}
            placeholder="e.g., ABC123"
            maxLength={6}
            className="w-full px-4 py-2.5 bg-[#0c0a12] border border-[#1c1928] rounded-lg text-[14px] text-[#e0dfe4] placeholder-[#4a4660] outline-none focus:border-[#2d2a40] transition-colors font-mono tracking-widest text-center uppercase"
            autoFocus
          />
          {error && (
            <p className="text-[12px] text-red-400 mt-2">{error}</p>
          )}
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
            disabled={code.trim().length < 6 || joining}
            className="px-5 py-2 text-[13px] bg-[#ec4899] hover:bg-[#db2777] text-white font-medium rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {joining ? 'Joining...' : 'Join Challenge'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
