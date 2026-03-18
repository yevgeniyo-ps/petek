import { useState, useMemo, useRef, useEffect } from 'react';
import { Trophy, Plus, Check, X, Trash2, CalendarPlus, Pencil, Flame, Share2, Users, Copy, LogOut, UserPlus, Info, Menu } from 'lucide-react';
import { useChallenges } from '../context/ChallengesContext';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../i18n';
import { Challenge, ChallengeStatus } from '../types';
import Modal from '../components/ui/Modal';
import ConfirmDialog from '../components/ui/ConfirmDialog';

function getDaysRemaining(endDate: string): number {
  const end = new Date(endDate + 'T00:00:00');
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
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

function formatDate(dateStr: string, lang: string = 'en'): string {
  const localeMap: Record<string, string> = { en: 'en-US', ru: 'ru-RU', he: 'he-IL', es: 'es-ES' };
  return new Date(dateStr + 'T00:00:00').toLocaleDateString(localeMap[lang] || 'en-US', { month: 'short', day: 'numeric' });
}

function getMyParticipant(challenge: Challenge, userId: string) {
  if (challenge.invite_code && challenge.participants) {
    return challenge.participants.find(p => p.user_id === userId);
  }
  return undefined;
}

function getMyFailedDays(challenge: Challenge, userId: string): string[] {
  return getMyParticipant(challenge, userId)?.failed_days || challenge.failed_days || [];
}

function getMyStreakStart(challenge: Challenge, userId: string): string {
  if (challenge.invite_code && challenge.participants) {
    const me = challenge.participants.find(p => p.user_id === userId);
    if (me && me.user_id !== challenge.user_id && me.joined_at) {
      return me.joined_at.slice(0, 10);
    }
  }
  return challenge.start_date;
}

function getParticipantLabel(displayName: string, email: string): string {
  if (displayName) {
    const parts = displayName.split(' ');
    const first = parts[0];
    const lastInitial = parts[1]?.[0] ? ` ${parts[1][0]}.` : '';
    return `${first}${lastInitial} (${email.split('@')[0]})`;
  }
  return email.split('@')[0] || email;
}

export default function ChallengesPage() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { challenges, loading, createChallenge, updateChallenge, deleteChallenge, generateInviteCode, joinChallenge, toggleFailedDay, leaveChallenge, removeParticipant } = useChallenges();
  const [createOpen, setCreateOpen] = useState(false);
  const [joinOpen, setJoinOpen] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deletingChallenge, setDeletingChallenge] = useState<Challenge | null>(null);
  const [leaveConfirmOpen, setLeaveConfirmOpen] = useState(false);
  const [leavingChallenge, setLeavingChallenge] = useState<Challenge | null>(null);
  const [removeConfirmOpen, setRemoveConfirmOpen] = useState(false);
  const [removingChallenge, setRemovingChallenge] = useState<Challenge | null>(null);
  const [removingUserId, setRemovingUserId] = useState<string | null>(null);

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

  const handleRemoveConfirm = (challenge: Challenge, uid: string) => {
    setRemovingChallenge(challenge);
    setRemovingUserId(uid);
    setRemoveConfirmOpen(true);
  };

  const handleRemove = async () => {
    if (removingChallenge && removingUserId) {
      await removeParticipant(removingChallenge.id, removingUserId);
      setRemoveConfirmOpen(false);
      setRemovingChallenge(null);
      setRemovingUserId(null);
    }
  };

  const handleJoin = async (code: string) => {
    await joinChallenge(code);
    setJoinOpen(false);
    setJoinCode('');
  };

  if (loading) {
    return <div className="text-[#7a7890] text-[14px] text-center pt-40">{t.common.loading}</div>;
  }

  if (challenges.length === 0) {
    return (
      <div className="max-w-[1200px] px-4 py-6 md:px-12 md:py-10">
        <div className="flex items-center gap-3 mb-1">
          <Trophy size={24} className="text-[#ec4899]" />
          <h1 className="text-[26px] font-bold text-white leading-tight">{t.challenges.title}</h1>
        </div>
        <p className="text-[14px] text-[#7a7890] mt-2 mb-8">
          {t.challenges.subtitle}
        </p>

        <div className="flex flex-col items-center justify-center py-20 rounded-xl bg-[#0f0d18] border border-[#1c1928]">
          <Trophy size={40} className="text-[#4a4660] mb-4" />
          <p className="text-[15px] text-[#7a7890] mb-4">{t.challenges.noChallenges}</p>
          <div className="flex gap-2">
            <button
              onClick={() => setCreateOpen(true)}
              className="flex items-center gap-2 px-5 py-2.5 text-[13px] font-medium text-white bg-[#ec4899] hover:bg-[#db2777] rounded-full transition-colors"
            >
              <Plus size={16} />
              {t.challenges.newChallenge}
            </button>
            <button
              onClick={() => setJoinOpen(true)}
              className="flex items-center gap-2 px-5 py-2.5 text-[13px] font-medium text-[#7a7890] hover:text-white bg-white/[0.04] hover:bg-white/[0.08] rounded-full transition-colors"
            >
              <UserPlus size={16} />
              {t.common.join}
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
            <h1 className="text-[26px] font-bold text-white leading-tight">{t.challenges.title}</h1>
            <p className="text-[14px] text-[#7a7890] mt-1">
              {t.challenges.activeCount.replace('{n}', String(activeChallenges.length))}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setJoinOpen(true)}
            className="flex items-center gap-2 px-4 py-2 text-[13px] font-medium text-[#7a7890] hover:text-white bg-white/[0.04] hover:bg-white/[0.08] rounded-full transition-colors"
          >
            <UserPlus size={16} />
            {t.common.join}
          </button>
          <button
            onClick={() => setCreateOpen(true)}
            className="flex items-center gap-2 px-4 py-2 text-[13px] font-medium text-white bg-[#ec4899] hover:bg-[#db2777] rounded-full transition-colors"
          >
            <Plus size={16} />
            {t.challenges.newChallenge}
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
              onRemoveParticipant={challenge.user_id === user.id ? (uid) => handleRemoveConfirm(challenge, uid) : undefined}
            />
          ))}
        </div>
      )}

      {/* Past challenges */}
      {pastChallenges.length > 0 && user && (
        <>
          <h2 className="text-[13px] font-medium text-[#7a7890] uppercase tracking-wider mb-4">{t.challenges.pastChallenges}</h2>
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
        title={t.challenges.deleteChallenge}
        message={t.challenges.deleteMessage.replace('{name}', deletingChallenge?.name ?? '')}
        confirmLabel={t.common.delete}
      />

      <ConfirmDialog
        open={leaveConfirmOpen}
        onClose={() => setLeaveConfirmOpen(false)}
        onConfirm={handleLeave}
        title={t.challenges.leaveChallenge}
        message={t.challenges.leaveMessage.replace('{name}', leavingChallenge?.name ?? '')}
        confirmLabel={t.common.leave}
      />

      <ConfirmDialog
        open={removeConfirmOpen}
        onClose={() => setRemoveConfirmOpen(false)}
        onConfirm={handleRemove}
        title={t.challenges.removeParticipant}
        message={t.challenges.removeParticipantMessage.replace('{name}', (() => {
          const p = removingChallenge?.participants?.find(p => p.user_id === removingUserId);
          return p ? getParticipantLabel(p.display_name, p.email) : '';
        })())}
        confirmLabel={t.common.delete}
      />
    </div>
  );
}

function TodayCheckin({ challenges, userId, onToggleDay }: {
  challenges: Challenge[];
  userId: string;
  onToggleDay: (id: string, day: string) => void;
}) {
  const { t, language } = useLanguage();
  const today = getTodayStr();
  const date = new Date(today + 'T00:00:00');
  const localeMap: Record<string, string> = { en: 'en-US', ru: 'ru-RU', he: 'he-IL', es: 'es-ES' };
  const label = date.toLocaleDateString(localeMap[language] || 'en-US', { weekday: 'short', month: 'short', day: 'numeric' });

  return (
    <div className="mb-6 rounded-xl border border-[#1c1928] bg-[#13111c] p-5">
      <div className="text-[13px] text-[#7a7890] mb-4">{t.challenges.today}, {label}</div>
      <div className="flex flex-col gap-3">
        {challenges.map(c => {
          const myFailedDays = getMyFailedDays(c, userId);
          const isFailed = myFailedDays.includes(today);
          const streakStart = getMyStreakStart(c, userId);
          const streak = getStreak(myFailedDays, streakStart, today);
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
  const { t, language } = useLanguage();
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
                title={isBeforeJoin ? `${formatDate(day, language)} (${t.challenges.beforeJoin})` : formatDate(day, language)}
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

function ChallengeCard({ challenge, userId, onComplete, onFail, onDelete, onExtend, onRename, onToggleDay, onShare, onLeave, onRemoveParticipant }: {
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
  onRemoveParticipant?: (userId: string) => void;
}) {
  const { t, language } = useLanguage();
  const isActive = challenge.status === 'active';
  const isOwner = challenge.user_id === userId;
  const isShared = !!challenge.invite_code;
  const daysRemaining = getDaysRemaining(challenge.end_date);
  const [extending, setExtending] = useState(false);
  const [newEndDate, setNewEndDate] = useState(challenge.end_date);
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(challenge.name);
  const editRef = useRef<HTMLInputElement>(null);
  const days = useMemo(() => getDateRange(challenge.start_date, challenge.end_date), [challenge.start_date, challenge.end_date]);
  const today = getTodayStr();
  const [showInviteCode, setShowInviteCode] = useState(false);
  const [inviteCode, setInviteCode] = useState(challenge.invite_code || '');
  const [copied, setCopied] = useState(false);
  const [showLegend, setShowLegend] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);

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
    const code = await onShare();
    setInviteCode(code);
    setShowInviteCode(true);
  };

  const handleCopyCode = async () => {
    await navigator.clipboard.writeText(inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`rounded-xl border p-5 transition-colors min-w-0 ${
      isActive
        ? 'bg-[#13111c] border-white/10 hover:border-white/20'
        : 'bg-[#0f0d18] border-white/10 opacity-60'
    }`}>
      {/* Header: name + days + menu */}
      <div className="flex items-center gap-2 group">
        <div className="flex-1 min-w-0 cursor-pointer" onClick={() => !editing && setExpanded(!expanded)}>
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
              onClick={e => e.stopPropagation()}
              className="w-full text-[15px] font-medium text-white leading-snug bg-transparent border-b border-[#2d2a40] outline-none"
            />
          ) : (
            <div className="flex items-center gap-2">
              <h3 className="text-[15px] font-medium text-white leading-snug truncate">{challenge.name}</h3>
              {isShared && (
                <span className="flex items-center gap-1 text-[11px] text-[#4a4660] shrink-0">
                  <Users size={12} />
                  {challenge.participants?.length || 0}
                </span>
              )}
            </div>
          )}
        </div>
        {isActive ? (
          <span className="shrink-0 flex items-center gap-2">
            {(() => {
              const streakStart = getMyStreakStart(challenge, userId);
              const elapsed = Math.max(0, Math.ceil((new Date(today + 'T00:00:00').getTime() - new Date(streakStart + 'T00:00:00').getTime()) / (1000 * 60 * 60 * 24)) + 1);
              const failedCount = myFailedDays.filter(d => d >= streakStart && d <= today).length;
              const passedCount = elapsed - failedCount;
              return (
                <span className="text-[11px]">
                  <span className="text-[#ec4899]">{passedCount}</span>/<span className="text-amber-400">{failedCount}</span>
                </span>
              );
            })()}
            <span>
              <span className="text-[20px] font-bold text-[#ec4899] leading-none">{Math.max(daysRemaining, 0)}</span>
              <span className="text-[11px] text-[#7a7890] ml-1">{t.challenges.daysLeft}</span>
            </span>
          </span>
        ) : (
          <span className={`shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium ${
            challenge.status === 'completed'
              ? 'bg-emerald-500/10 text-emerald-400'
              : 'bg-red-500/10 text-red-400'
          }`}>
            {challenge.status === 'completed' ? <Check size={11} /> : <X size={11} />}
            {challenge.status === 'completed' ? t.challenges.completed : t.common.failed}
          </span>
        )}
        {isActive && onRename && (
          <button
            onClick={() => { setEditName(challenge.name); setEditing(true); }}
            className="p-1 rounded-lg text-[#7a7890] opacity-0 group-hover:opacity-100 hover:text-white transition-all shrink-0"
            title={t.challenges.editName}
          >
            <Pencil size={12} />
          </button>
        )}
        {expanded && <div className="relative shrink-0">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-1 rounded-lg text-[#4a4660] hover:text-white hover:bg-white/[0.08] transition-colors"
          >
            <Menu size={14} />
          </button>
          {menuOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
              <div className="absolute top-full right-0 mt-1 z-50 bg-[#1e1b2e] border border-[#3a3650] rounded-lg shadow-xl py-1 w-44">
                {isActive && isOwner && (
                  <>
                    <button onClick={() => { onComplete?.(); setMenuOpen(false); }} className="w-full flex items-center gap-2.5 px-3 py-2 text-[13px] text-[#c0bfd0] hover:bg-white/[0.08] hover:text-white transition-colors">
                      <Check size={14} /> {t.challenges.markCompleted}
                    </button>
                    <button onClick={() => { onFail?.(); setMenuOpen(false); }} className="w-full flex items-center gap-2.5 px-3 py-2 text-[13px] text-[#c0bfd0] hover:bg-white/[0.08] hover:text-white transition-colors">
                      <X size={14} /> {t.challenges.markFailed}
                    </button>
                    <button onClick={() => { setExtending(true); setNewEndDate(challenge.end_date); setMenuOpen(false); }} className="w-full flex items-center gap-2.5 px-3 py-2 text-[13px] text-[#c0bfd0] hover:bg-white/[0.08] hover:text-white transition-colors">
                      <CalendarPlus size={14} /> {t.challenges.changeEndDate}
                    </button>
                    <button onClick={() => { if (isShared) setShowInviteCode(!showInviteCode); else handleShare(); setMenuOpen(false); }} className="w-full flex items-center gap-2.5 px-3 py-2 text-[13px] text-[#c0bfd0] hover:bg-white/[0.08] hover:text-white transition-colors">
                      <Share2 size={14} /> {isShared ? t.challenges.showInviteCode : t.challenges.shareChallenge}
                    </button>
                    <button onClick={() => { setShowLegend(!showLegend); setMenuOpen(false); }} className="w-full flex items-center gap-2.5 px-3 py-2 text-[13px] text-[#c0bfd0] hover:bg-white/[0.08] hover:text-white transition-colors">
                      <Info size={14} /> {t.challenges.legend}
                    </button>
                    <div className="border-t border-[#1c1928] my-1" />
                    <button onClick={() => { onDelete?.(); setMenuOpen(false); }} className="w-full flex items-center gap-2.5 px-3 py-2 text-[13px] text-red-400 hover:bg-white/[0.08] hover:text-red-400 transition-colors">
                      <Trash2 size={14} /> {t.common.delete}
                    </button>
                  </>
                )}
                {isActive && !isOwner && (
                  <>
                    <button onClick={() => { setShowLegend(!showLegend); setMenuOpen(false); }} className="w-full flex items-center gap-2.5 px-3 py-2 text-[13px] text-[#c0bfd0] hover:bg-white/[0.08] hover:text-white transition-colors">
                      <Info size={14} /> {t.challenges.legend}
                    </button>
                    <div className="border-t border-[#1c1928] my-1" />
                    <button onClick={() => { onLeave?.(); setMenuOpen(false); }} className="w-full flex items-center gap-2.5 px-3 py-2 text-[13px] text-red-400 hover:bg-white/[0.08] hover:text-red-400 transition-colors">
                      <LogOut size={14} /> {t.common.leave}
                    </button>
                  </>
                )}
                {!isActive && isOwner && (
                  <button onClick={() => { onDelete?.(); setMenuOpen(false); }} className="w-full flex items-center gap-2.5 px-3 py-2 text-[13px] text-red-400 hover:bg-white/[0.08] hover:text-red-400 transition-colors">
                    <Trash2 size={14} /> {t.common.delete}
                  </button>
                )}
                {!isActive && !isOwner && (
                  <button onClick={() => { onLeave?.(); setMenuOpen(false); }} className="w-full flex items-center gap-2.5 px-3 py-2 text-[13px] text-red-400 hover:bg-white/[0.08] hover:text-red-400 transition-colors">
                    <LogOut size={14} /> {t.common.leave}
                  </button>
                )}
              </div>
            </>
          )}
        </div>}
      </div>

      {/* Expanded content */}
      {expanded && (
      <>
      {/* Date range */}
      {isActive && (
        <div className="text-[11px] text-[#4a4660] mt-2">
          {formatDate(challenge.start_date, language)} – {formatDate(challenge.end_date, language)}
        </div>
      )}

      {/* Day grids */}
      <div className="mt-3" />
      {isShared && challenge.participants ? (() => {
        const me = challenge.participants.find(p => p.user_id === userId);
        const others = challenge.participants.filter(p => p.user_id !== userId);

        const renderParticipant = (participant: typeof challenge.participants[0], isMe: boolean) => {
          const pFailed = participant.failed_days || [];
          const joinDate = participant.user_id !== challenge.user_id ? participant.joined_at?.slice(0, 10) : challenge.start_date;
          const startFrom = joinDate || challenge.start_date;
          const elapsed = isActive ? Math.max(0, Math.ceil((new Date(today + 'T00:00:00').getTime() - new Date(startFrom + 'T00:00:00').getTime()) / (1000 * 60 * 60 * 24)) + 1) : 0;
          const failedCount = pFailed.filter(d => d >= startFrom && d <= today).length;
          const passedCount = elapsed - failedCount;
          const canRemove = !isMe && isOwner && isActive && participant.user_id !== challenge.user_id && onRemoveParticipant;
          return (
            <div key={participant.id}>
              <div className="flex items-center gap-1.5 text-[10px] text-[#7a7890] mb-1">
                <span className="truncate">
                  {isMe ? t.common.you : getParticipantLabel(participant.display_name, participant.email)}
                </span>
                {isActive && (
                  <span className="shrink-0">
                    (<span className="text-[#ec4899]">{passedCount}</span>/<span className="text-amber-400">{failedCount}</span>)
                  </span>
                )}
                {canRemove && (
                  <button
                    onClick={() => onRemoveParticipant(participant.user_id)}
                    className="p-0.5 rounded text-[#7a7890] hover:text-red-400 hover:bg-red-400/10 transition-colors shrink-0"
                    title={t.challenges.removeParticipant}
                  >
                    <X size={10} />
                  </button>
                )}
              </div>
              <DayGrid
                days={days}
                failedDays={pFailed}
                today={today}
                isActive={isActive}
                clickable={isMe}
                onToggleDay={isMe ? onToggleDay : undefined}
                joinedAt={participant.user_id !== challenge.user_id ? participant.joined_at : undefined}
              />
            </div>
          );
        };

        return (
          <div className="space-y-2 mb-3">
            {me && renderParticipant(me, true)}
            {others.length > 0 && (
              <details>
                <summary className="text-[10px] text-[#4a4660] cursor-pointer hover:text-[#7a7890] transition-colors list-none">
                  +{others.length} {t.common.participants}
                </summary>
                <div className="space-y-2 mt-2">
                  {others.map(p => renderParticipant(p, false))}
                </div>
              </details>
            )}
            {/* Legend */}
            {showLegend && (
              <div className="flex items-center gap-3 mt-1">
                <span className="flex items-center gap-1 text-[10px] text-[#4a4660]">
                  <span className="w-[8px] h-[8px] rounded-[2px] bg-[#ec4899]" /> {t.challenges.passed}
                </span>
                <span className="flex items-center gap-1 text-[10px] text-[#4a4660]">
                  <span className="w-[8px] h-[8px] rounded-[2px] bg-amber-400" /> {t.common.failed}
                </span>
                <span className="flex items-center gap-1 text-[10px] text-[#4a4660]">
                  <span className="w-[8px] h-[8px] rounded-[2px] bg-white/[0.15]" /> {t.challenges.upcoming}
                </span>
                <span className="flex items-center gap-1 text-[10px] text-[#4a4660]">
                  <span className="w-[8px] h-[8px] rounded-[2px] bg-[#1c1928]" style={{ backgroundImage: 'repeating-linear-gradient(135deg, transparent, transparent 2px, rgba(255,255,255,0.07) 2px, rgba(255,255,255,0.07) 3px)' }} /> {t.challenges.beforeJoin}
                </span>
              </div>
            )}
          </div>
        );
      })() : (
        <div className="mb-3">
          {isActive && (() => {
            const elapsed = Math.max(0, Math.ceil((new Date(today + 'T00:00:00').getTime() - new Date(challenge.start_date + 'T00:00:00').getTime()) / (1000 * 60 * 60 * 24)) + 1);
            const failedCount = myFailedDays.filter(d => d >= challenge.start_date && d <= today).length;
            const passedCount = elapsed - failedCount;
            return (
              <div className="text-[10px] text-[#7a7890] mb-1">
                <span className="text-[#ec4899]">{passedCount}</span>/<span className="text-amber-400">{failedCount}</span>
              </div>
            );
          })()}
          <DayGrid
            days={days}
            failedDays={myFailedDays}
            today={today}
            isActive={isActive}
            clickable={true}
            onToggleDay={onToggleDay}
          />
          {showLegend && (
            <div className="flex items-center gap-3 mt-1">
              <span className="flex items-center gap-1 text-[10px] text-[#4a4660]">
                <span className="w-[8px] h-[8px] rounded-[2px] bg-[#ec4899]" /> {t.challenges.passed}
              </span>
              <span className="flex items-center gap-1 text-[10px] text-[#4a4660]">
                <span className="w-[8px] h-[8px] rounded-[2px] bg-amber-400" /> {t.common.failed}
              </span>
              <span className="flex items-center gap-1 text-[10px] text-[#4a4660]">
                <span className="w-[8px] h-[8px] rounded-[2px] bg-white/[0.15]" /> {t.challenges.upcoming}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Invite code display */}
      {showInviteCode && inviteCode && (
        <div className="flex items-center gap-2 mb-3 p-2.5 rounded-lg bg-[#0c0a12] border border-[#1c1928]">
          <span className="text-[14px] font-mono font-medium text-white tracking-widest flex-1">{inviteCode}</span>
          <button
            onClick={handleCopyCode}
            className="flex items-center gap-1 px-2 py-1 text-[11px] text-[#7a7890] hover:text-white transition-colors"
          >
            <Copy size={12} />
            {copied ? t.common.copied : t.common.copy}
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
            {t.common.save}
          </button>
          <button
            onClick={() => { setExtending(false); setNewEndDate(challenge.end_date); }}
            className="px-2 py-1.5 text-[12px] text-[#7a7890] hover:text-white transition-colors"
          >
            {t.common.cancel}
          </button>
        </div>
      )}
      </>
      )}

    </div>
  );
}

function CreateChallengeModal({ open, onClose, onSave }: {
  open: boolean;
  onClose: () => void;
  onSave: (name: string, endDate: string) => Promise<void>;
}) {
  const { t } = useLanguage();
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
          <h2 className="text-[16px] font-semibold text-white">{t.challenges.newChallenge}</h2>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-[13px] text-[#7a7890] mb-1.5">{t.challenges.challengeName}</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder={t.challenges.challengePlaceholder}
              className="w-full px-4 py-2.5 bg-[#0c0a12] border border-[#1c1928] rounded-lg text-[14px] text-[#e0dfe4] placeholder-[#4a4660] outline-none focus:border-[#2d2a40] transition-colors"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-[13px] text-[#7a7890] mb-1.5">{t.challenges.endDate}</label>
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
            {t.common.cancel}
          </button>
          <button
            type="submit"
            disabled={!name.trim() || !endDate || saving}
            className="px-5 py-2 text-[13px] bg-[#ec4899] hover:bg-[#db2777] text-white font-medium rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? t.common.creating : t.challenges.createChallenge}
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
  const { t } = useLanguage();
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
          <h2 className="text-[16px] font-semibold text-white">{t.challenges.joinChallenge}</h2>
        </div>

        <div>
          <label className="block text-[13px] text-[#7a7890] mb-1.5">{t.challenges.inviteCode}</label>
          <input
            type="text"
            value={code}
            onChange={e => setCode(e.target.value.toUpperCase().slice(0, 6))}
            placeholder={t.challenges.inviteCodePlaceholder}
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
            {t.common.cancel}
          </button>
          <button
            type="submit"
            disabled={code.trim().length < 6 || joining}
            className="px-5 py-2 text-[13px] bg-[#ec4899] hover:bg-[#db2777] text-white font-medium rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {joining ? t.challenges.joining : t.challenges.joinChallenge}
          </button>
        </div>
      </form>
    </Modal>
  );
}
