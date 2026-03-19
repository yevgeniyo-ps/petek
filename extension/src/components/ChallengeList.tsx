import { useState, useMemo, useRef, useEffect } from 'react';
import { useChallenges } from '@shared/context/ChallengesContext';
import { useExtAuth } from './LoginForm';
import { useLanguage } from '@shared/i18n';
import { Plus, Check, X, Trash2, CalendarPlus, Pencil, Flame, Share2, Users, Copy, LogOut, UserPlus, Info, Menu, RotateCcw } from 'lucide-react';
import { Challenge, ChallengeStatus } from '@shared/types';
import React from 'react';

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

function formatDate(dateStr: string, lang: string = 'en'): string {
  const localeMap: Record<string, string> = { en: 'en-US', ru: 'ru-RU', he: 'he-IL', es: 'es-ES' };
  return new Date(dateStr + 'T00:00:00').toLocaleDateString(localeMap[lang] || 'en-US', { month: 'short', day: 'numeric' });
}

function getMyFailedDays(challenge: Challenge, userId: string): string[] {
  if (challenge.invite_code && challenge.participants) {
    const me = challenge.participants.find(p => p.user_id === userId);
    return me?.failed_days || [];
  }
  return challenge.failed_days || [];
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

export function ChallengeList() {
  const { user } = useExtAuth();
  const { challenges, loading, createChallenge, updateChallenge, deleteChallenge, generateInviteCode, joinChallenge, toggleFailedDay, leaveChallenge, removeParticipant } = useChallenges();
  const { t, language } = useLanguage();
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState(false);
  const [name, setName] = useState('');
  const [endDate, setEndDate] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [joinError, setJoinError] = useState('');
  const [saving, setSaving] = useState(false);
  const [duration, setDuration] = useState<'1w' | '1m' | '3m' | 'custom'>('1m');
  const [removeConfirmUid, setRemoveConfirmUid] = useState<string | null>(null);
  const [removeConfirmChallengeId, setRemoveConfirmChallengeId] = useState<string | null>(null);

  const userId = user?.id || '';
  const activeChallenges = challenges.filter(c => c.status === 'active');
  const pastChallenges = challenges.filter(c => c.status !== 'active');

  const getEndDateForDuration = (d: '1w' | '1m' | '3m') => {
    const date = new Date();
    if (d === '1w') date.setDate(date.getDate() + 7);
    else if (d === '1m') date.setMonth(date.getMonth() + 1);
    else date.setMonth(date.getMonth() + 3);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  };

  const effectiveEndDate = duration === 'custom' ? endDate : getEndDateForDuration(duration);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !effectiveEndDate) return;
    setSaving(true);
    try {
      const today = new Date();
      const startDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      await createChallenge({ name: name.trim(), start_date: startDate, end_date: effectiveEndDate });
      setName('');
      setEndDate('');
      setDuration('1m');
      setCreating(false);
    } finally {
      setSaving(false);
    }
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = joinCode.trim().toUpperCase();
    if (trimmed.length < 6) return;
    setSaving(true);
    setJoinError('');
    try {
      await joinChallenge(trimmed);
      setJoinCode('');
      setJoining(false);
    } catch (err) {
      setJoinError(err instanceof Error ? err.message : 'Failed to join');
    } finally {
      setSaving(false);
    }
  };

  const handleStatus = async (id: string, status: ChallengeStatus) => {
    await updateChallenge(id, { status });
  };

  if (loading) {
    return <div className="text-[#7a7890] text-xs text-center py-8">{t.common.loading}</div>;
  }

  const today = new Date();
  const minDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate() + 1).padStart(2, '0')}`;

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Create / Join buttons */}
      <div className="px-4 pt-3 pb-2">
        {!creating && !joining ? (
          <div className="flex gap-2">
            <button
              onClick={() => setCreating(true)}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium text-[#ec4899] hover:bg-[#ec4899]/10 rounded-lg transition-colors"
            >
              <Plus size={14} />
              {t.common.new}
            </button>
            <button
              onClick={() => setJoining(true)}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium text-[#7a7890] hover:text-white hover:bg-white/5 rounded-lg transition-colors"
            >
              <UserPlus size={14} />
              {t.common.join}
            </button>
          </div>
        ) : creating ? (
          <form onSubmit={handleCreate} className="space-y-2">
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder={t.challenges.challengeName + '...'}
              className="w-full px-3 py-2 bg-[#0c0a12] border border-[#1c1928] rounded-lg text-xs text-[#e0dfe4] placeholder-[#4a4660] outline-none focus:border-[#2d2a40]"
              autoFocus
            />
            <div className="flex gap-1.5">
              {(['1w', '1m', '3m', 'custom'] as const).map(d => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDuration(d)}
                  className={`flex-1 py-1.5 text-[10px] rounded-lg transition-colors ${
                    duration === d
                      ? 'bg-[#ec4899]/20 text-[#ec4899] font-medium'
                      : 'text-[#7a7890] hover:text-white hover:bg-white/5'
                  }`}
                >
                  {d === '1w' ? t.challenges.oneWeek : d === '1m' ? t.challenges.oneMonth : d === '3m' ? t.challenges.threeMonths : t.challenges.custom}
                </button>
              ))}
            </div>
            {duration === 'custom' && (
              <input
                type="date"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                min={minDate}
                className="w-full px-3 py-2 bg-[#0c0a12] border border-[#1c1928] rounded-lg text-xs text-[#e0dfe4] outline-none focus:border-[#2d2a40] [color-scheme:dark]"
              />
            )}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => { setCreating(false); setName(''); setEndDate(''); setDuration('1m'); }}
                className="flex-1 py-1.5 text-xs text-[#7a7890] hover:text-white rounded-lg hover:bg-white/5 transition-colors"
              >
                {t.common.cancel}
              </button>
              <button
                type="submit"
                disabled={!name.trim() || !effectiveEndDate || saving}
                className="flex-1 py-1.5 text-xs font-medium text-white bg-[#ec4899] hover:bg-[#db2777] rounded-lg transition-colors disabled:opacity-50"
              >
                {saving ? '...' : t.common.create}
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleJoin} className="space-y-2">
            <input
              type="text"
              value={joinCode}
              onChange={e => setJoinCode(e.target.value.toUpperCase().slice(0, 6))}
              placeholder={t.challenges.inviteCode + '...'}
              maxLength={6}
              className="w-full px-3 py-2 bg-[#0c0a12] border border-[#1c1928] rounded-lg text-xs text-[#e0dfe4] placeholder-[#4a4660] outline-none focus:border-[#2d2a40] font-mono tracking-widest text-center uppercase"
              autoFocus
            />
            {joinError && <p className="text-[10px] text-red-400">{joinError}</p>}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => { setJoining(false); setJoinCode(''); setJoinError(''); }}
                className="flex-1 py-1.5 text-xs text-[#7a7890] hover:text-white rounded-lg hover:bg-white/5 transition-colors"
              >
                {t.common.cancel}
              </button>
              <button
                type="submit"
                disabled={joinCode.trim().length < 6 || saving}
                className="flex-1 py-1.5 text-xs font-medium text-white bg-[#ec4899] hover:bg-[#db2777] rounded-lg transition-colors disabled:opacity-50"
              >
                {saving ? '...' : t.common.join}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Today check-in */}
      {activeChallenges.length > 0 && (
        <TodayCheckin
          challenges={activeChallenges}
          userId={userId}
          onToggleDay={(id, day) => toggleFailedDay(id, day)}
        />
      )}

      {/* Active challenges */}
      <div className="px-4 space-y-2">
        {activeChallenges.map(challenge => (
          <ExtChallengeCard
            key={challenge.id}
            challenge={challenge}
            userId={userId}
            onComplete={challenge.user_id === userId ? () => handleStatus(challenge.id, 'completed') : undefined}
            onFail={challenge.user_id === userId ? () => handleStatus(challenge.id, 'failed') : undefined}
            onExtend={challenge.user_id === userId ? (newEnd) => updateChallenge(challenge.id, { end_date: newEnd }) : undefined}
            onDelete={challenge.user_id === userId ? () => deleteChallenge(challenge.id) : undefined}
            onRename={challenge.user_id === userId ? (name) => updateChallenge(challenge.id, { name }) : undefined}
            onToggleDay={(day) => toggleFailedDay(challenge.id, day)}
            onShare={challenge.user_id === userId ? () => generateInviteCode(challenge.id) : undefined}
            onLeave={challenge.user_id !== userId ? () => leaveChallenge(challenge.id) : undefined}
            onRemoveParticipant={challenge.user_id === userId ? (uid) => { setRemoveConfirmChallengeId(challenge.id); setRemoveConfirmUid(uid); } : undefined}
          />
        ))}
      </div>

      {/* Past challenges */}
      {pastChallenges.length > 0 && (
        <div className="px-4 mt-4">
          <div className="text-[10px] font-medium text-[#7a7890] uppercase tracking-wider mb-2">{t.common.past}</div>
          <div className="space-y-2">
            {pastChallenges.map(challenge => (
              <ExtChallengeCard
                key={challenge.id}
                challenge={challenge}
                userId={userId}
                onDelete={challenge.user_id === userId ? () => deleteChallenge(challenge.id) : undefined}
                onLeave={challenge.user_id !== userId ? () => leaveChallenge(challenge.id) : undefined}
                onToggleDay={() => {}}
                onReactivate={challenge.user_id === userId ? (newEnd) => updateChallenge(challenge.id, { status: 'active', end_date: newEnd }) : undefined}
                onRemoveParticipant={challenge.user_id === userId ? (uid) => { setRemoveConfirmChallengeId(challenge.id); setRemoveConfirmUid(uid); } : undefined}
              />
            ))}
          </div>
        </div>
      )}

      {challenges.length === 0 && (
        <div className="text-center py-8 text-[#7a7890] text-xs">
          {t.challenges.noChallengesExt}
        </div>
      )}

      {/* Remove participant confirm */}
      {removeConfirmUid && removeConfirmChallengeId && (() => {
        const ch = challenges.find(c => c.id === removeConfirmChallengeId);
        const p = ch?.participants?.find(p => p.user_id === removeConfirmUid);
        const name = p ? getParticipantLabel(p.display_name, p.email) : '';
        return (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-[#13111c] border border-[#1c1928] rounded-lg p-4 max-w-[280px] w-full">
              <div className="text-[13px] font-medium text-white mb-2">{t.challenges.removeParticipant}</div>
              <div className="text-[12px] text-[#7a7890] mb-4">{t.challenges.removeParticipantMessage.replace('{name}', name)}</div>
              <div className="flex gap-2">
                <button
                  onClick={() => { setRemoveConfirmUid(null); setRemoveConfirmChallengeId(null); }}
                  className="flex-1 py-1.5 text-xs text-[#7a7890] hover:text-white rounded-lg hover:bg-white/5 transition-colors"
                >
                  {t.common.cancel}
                </button>
                <button
                  onClick={async () => {
                    await removeParticipant(removeConfirmChallengeId, removeConfirmUid);
                    setRemoveConfirmUid(null);
                    setRemoveConfirmChallengeId(null);
                  }}
                  className="flex-1 py-1.5 text-xs font-medium text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors"
                >
                  {t.common.delete}
                </button>
              </div>
            </div>
          </div>
        );
      })()}
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
    <div className="mx-4 mb-3 rounded-lg border border-[#1c1928] bg-[#13111c] p-3">
      <div className="text-[11px] text-[#7a7890] mb-1">{t.challenges.today}, {label}</div>
      <div className="text-[9px] text-[#4a4660] mb-2">{t.challenges.tapIfFailed}</div>
      <div className="flex flex-col gap-2">
        {challenges.map(c => {
          const myFailedDays = getMyFailedDays(c, userId);
          const isFailed = myFailedDays.includes(today);
          const streakStart = getMyStreakStart(c, userId);
          const streak = getStreak(myFailedDays, streakStart, today);
          return (
            <button
              key={c.id}
              onClick={() => onToggleDay(c.id, today)}
              className={`flex items-center gap-2 rounded-md px-2.5 py-2 transition-all text-left ${
                isFailed
                  ? 'bg-amber-400/[0.06] hover:bg-amber-400/[0.1]'
                  : 'bg-[#ec4899]/[0.06] hover:bg-[#ec4899]/[0.1]'
              }`}
            >
              <span className={`w-4 h-4 rounded-[2px] flex-shrink-0 transition-colors ${
                isFailed ? 'bg-amber-400' : 'bg-[#ec4899]'
              }`} />
              <span className={`text-[12px] truncate transition-colors ${
                isFailed ? 'text-amber-400/80' : 'text-white'
              }`}>{c.name}</span>
              {streak >= 3 && (
                <span className="flex items-center gap-0.5 text-[10px] text-[#ec4899] font-medium shrink-0">
                  <Flame size={11} />
                  {streak}
                </span>
              )}
              <span className="flex-1" />
              {c.invite_code && (
                <span className="text-[#4a4660]"><Users size={11} /></span>
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
  const joinDate = joinedAt ? joinedAt.slice(0, 10) : null;
  const firstDate = new Date(days[0] + 'T00:00:00');
  const firstDow = firstDate.getDay();
  const padded: (string | null)[] = Array(firstDow).fill(null).concat(days);
  const numCols = Math.ceil(padded.length / 7);
  while (padded.length < numCols * 7) padded.push(null);

  return (
    <div className="flex gap-[2px] overflow-x-auto p-[2px]">
      {Array.from({ length: numCols }, (_, col) => (
        <div key={col} className="flex flex-col gap-[2px]">
          {Array.from({ length: 7 }, (_, row) => {
            const day = padded[col * 7 + row];
            if (!day) return <div key={row} className="w-[7px] h-[7px]" />;

            const isFailed = failedDays.includes(day);
            const isToday = day === today;
            const isPast = day < today;
            const isBeforeJoin = joinDate ? day < joinDate : false;
            const canClick = clickable && (isPast || isToday) && isActive && !isBeforeJoin;

            let color: string;
            let style: React.CSSProperties | undefined;
            if (isBeforeJoin) {
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
                className={`w-[7px] h-[7px] rounded-[2px] transition-colors ${color} ${
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

function ExtChallengeCard({ challenge, userId, onComplete, onFail, onExtend, onDelete, onRename, onToggleDay, onShare, onLeave, onRemoveParticipant, onReactivate }: {
  challenge: Challenge;
  userId: string;
  onComplete?: () => void;
  onFail?: () => void;
  onExtend?: (newEndDate: string) => void;
  onDelete?: () => void;
  onRename?: (name: string) => void;
  onToggleDay: (day: string) => void;
  onShare?: () => Promise<string>;
  onLeave?: () => void;
  onRemoveParticipant?: (userId: string) => void;
  onReactivate?: (newEndDate: string) => void;
}) {
  const { t, language } = useLanguage();
  const isOwner = challenge.user_id === userId;
  const isShared = !!challenge.invite_code;
  const isActive = challenge.status === 'active';
  const [extending, setExtending] = useState(false);
  const [newEndDate, setNewEndDate] = useState(challenge.end_date);
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(challenge.name);
  const editRef = useRef<HTMLInputElement>(null);
  const days = useMemo(() => getDateRange(challenge.start_date, challenge.end_date), [challenge.start_date, challenge.end_date]);
  const today = getTodayStr();
  const daysRemaining = getDaysRemaining(challenge.end_date);
  const myFailedDays = getMyFailedDays(challenge, userId);
  const [showInviteCode, setShowInviteCode] = useState(false);
  const [inviteCode, setInviteCode] = useState(challenge.invite_code || '');
  const [sharing, setSharing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showLegend, setShowLegend] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [reactivating, setReactivating] = useState(false);
  const [reactivateEndDate, setReactivateEndDate] = useState('');

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

  const handleReactivateClick = () => {
    const orig = Math.ceil((new Date(challenge.end_date + 'T00:00:00').getTime() - new Date(challenge.start_date + 'T00:00:00').getTime()) / (1000 * 60 * 60 * 24));
    const d = new Date();
    d.setDate(d.getDate() + orig);
    setReactivateEndDate(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`);
    setReactivating(true);
    setMenuOpen(false);
  };

  return (
    <div className="bg-[#13111c] border border-white/10 rounded-lg p-3 min-w-0">
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
              className="w-full text-[13px] font-medium text-white leading-snug bg-transparent border-b border-[#2d2a40] outline-none"
            />
          ) : (
            <div className="flex items-center gap-1.5">
              <span className="text-[13px] text-white font-medium leading-snug truncate">{challenge.name}</span>
              {isShared && (
                <span className="flex items-center gap-0.5 text-[10px] text-[#4a4660] shrink-0">
                  <Users size={10} />
                  {challenge.participants?.length || 0}
                </span>
              )}
              {(() => {
                const streakStart = getMyStreakStart(challenge, userId);
                const streak = isActive ? getStreak(myFailedDays, streakStart, today) : getStreak(myFailedDays, streakStart, challenge.end_date);
                return streak >= 3 ? (
                  <span className="flex items-center gap-0.5 text-[10px] text-[#ec4899] font-medium shrink-0">
                    <Flame size={11} />
                    {streak}
                  </span>
                ) : null;
              })()}
            </div>
          )}
        </div>
        <span className="shrink-0 flex items-center gap-1.5">
          {(() => {
            const streakStart = getMyStreakStart(challenge, userId);
            const endRef = isActive ? today : challenge.end_date;
            const elapsed = Math.max(0, Math.ceil((new Date(endRef + 'T00:00:00').getTime() - new Date(streakStart + 'T00:00:00').getTime()) / (1000 * 60 * 60 * 24)) + 1);
            const failedCount = myFailedDays.filter(d => d >= streakStart && d <= endRef).length;
            const passedCount = elapsed - failedCount;
            return (
              <span className="text-[9px]">
                <span className="text-[#ec4899]">{passedCount}</span>/<span className="text-amber-400">{failedCount}</span>
              </span>
            );
          })()}
          {isActive ? (
            <span className="leading-none">
              <span className="text-[16px] font-bold text-[#ec4899]">{Math.max(daysRemaining, 0)}</span>
              <span className="text-[9px] text-[#7a7890] ml-1">{t.challenges.daysLeft}</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-medium bg-white/[0.08] text-[#c0bfd0]">
              {challenge.status === 'completed' ? <Check size={9} /> : <X size={9} />}
              {challenge.status === 'completed' ? t.challenges.completed : t.common.failed}
            </span>
          )}
        </span>
        {isActive && isOwner && onRename && (
          <button
            onClick={() => { setEditName(challenge.name); setEditing(true); }}
            className="p-0.5 rounded text-[#7a7890] opacity-0 group-hover:opacity-100 hover:text-white transition-all shrink-0"
            title={t.challenges.editName}
          >
            <Pencil size={10} />
          </button>
        )}
        {expanded && <div className="relative shrink-0">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-0.5 rounded text-[#4a4660] hover:text-white hover:bg-white/[0.08] transition-colors"
          >
            <Menu size={12} />
          </button>
          {menuOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
              <div className="absolute top-full right-0 mt-1 z-50 bg-[#1e1b2e] border border-[#3a3650] rounded-lg shadow-xl py-1 w-40">
                {isActive && isOwner && (
                  <>
                    <button onClick={() => { onComplete?.(); setMenuOpen(false); }} className="w-full flex items-center gap-2 px-3 py-1.5 text-[11px] text-[#c0bfd0] hover:bg-white/[0.08] hover:text-white transition-colors">
                      <Check size={13} /> {t.challenges.markCompleted}
                    </button>
                    <button onClick={() => { onFail?.(); setMenuOpen(false); }} className="w-full flex items-center gap-2 px-3 py-1.5 text-[11px] text-[#c0bfd0] hover:bg-white/[0.08] hover:text-white transition-colors">
                      <X size={13} /> {t.challenges.markFailed}
                    </button>
                    <button onClick={() => { setExtending(true); setNewEndDate(challenge.end_date); setMenuOpen(false); }} className="w-full flex items-center gap-2 px-3 py-1.5 text-[11px] text-[#c0bfd0] hover:bg-white/[0.08] hover:text-white transition-colors">
                      <CalendarPlus size={13} /> {t.challenges.changeEndDate}
                    </button>
                    <button onClick={() => { if (isShared) setShowInviteCode(!showInviteCode); else handleShare(); setMenuOpen(false); }} className="w-full flex items-center gap-2 px-3 py-1.5 text-[11px] text-[#c0bfd0] hover:bg-white/[0.08] hover:text-white transition-colors">
                      <Share2 size={13} /> {isShared ? t.challenges.showInviteCode : t.challenges.shareChallenge}
                    </button>
                    <button onClick={() => { setShowLegend(!showLegend); setMenuOpen(false); }} className="w-full flex items-center gap-2 px-3 py-1.5 text-[11px] text-[#c0bfd0] hover:bg-white/[0.08] hover:text-white transition-colors">
                      <Info size={13} /> {t.challenges.legend}
                    </button>
                    <div className="border-t border-[#1c1928] my-1" />
                    <button onClick={() => { onDelete?.(); setMenuOpen(false); }} className="w-full flex items-center gap-2 px-3 py-1.5 text-[11px] text-red-400 hover:bg-white/[0.08] hover:text-red-400 transition-colors">
                      <Trash2 size={13} /> {t.common.delete}
                    </button>
                  </>
                )}
                {isActive && !isOwner && (
                  <>
                    <button onClick={() => { setShowLegend(!showLegend); setMenuOpen(false); }} className="w-full flex items-center gap-2 px-3 py-1.5 text-[11px] text-[#c0bfd0] hover:bg-white/[0.08] hover:text-white transition-colors">
                      <Info size={13} /> {t.challenges.legend}
                    </button>
                    <div className="border-t border-[#1c1928] my-1" />
                    <button onClick={() => { onLeave?.(); setMenuOpen(false); }} className="w-full flex items-center gap-2 px-3 py-1.5 text-[11px] text-red-400 hover:bg-white/[0.08] hover:text-red-400 transition-colors">
                      <LogOut size={13} /> {t.common.leave}
                    </button>
                  </>
                )}
                {!isActive && isOwner && (
                  <>
                    {onReactivate && (
                      <button onClick={handleReactivateClick} className="w-full flex items-center gap-2 px-3 py-1.5 text-[11px] text-[#c0bfd0] hover:bg-white/[0.08] hover:text-white transition-colors">
                        <RotateCcw size={13} /> {t.challenges.reactivate}
                      </button>
                    )}
                    <button onClick={() => { setShowLegend(!showLegend); setMenuOpen(false); }} className="w-full flex items-center gap-2 px-3 py-1.5 text-[11px] text-[#c0bfd0] hover:bg-white/[0.08] hover:text-white transition-colors">
                      <Info size={13} /> {t.challenges.legend}
                    </button>
                    <div className="border-t border-[#1c1928] my-1" />
                    <button onClick={() => { onDelete?.(); setMenuOpen(false); }} className="w-full flex items-center gap-2 px-3 py-1.5 text-[11px] text-red-400 hover:bg-white/[0.08] hover:text-red-400 transition-colors">
                      <Trash2 size={13} /> {t.common.delete}
                    </button>
                  </>
                )}
                {!isActive && !isOwner && (
                  <>
                    <button onClick={() => { setShowLegend(!showLegend); setMenuOpen(false); }} className="w-full flex items-center gap-2 px-3 py-1.5 text-[11px] text-[#c0bfd0] hover:bg-white/[0.08] hover:text-white transition-colors">
                      <Info size={13} /> {t.challenges.legend}
                    </button>
                    <div className="border-t border-[#1c1928] my-1" />
                    <button onClick={() => { onLeave?.(); setMenuOpen(false); }} className="w-full flex items-center gap-2 px-3 py-1.5 text-[11px] text-red-400 hover:bg-white/[0.08] hover:text-red-400 transition-colors">
                      <LogOut size={13} /> {t.common.leave}
                    </button>
                  </>
                )}
              </div>
            </>
          )}
        </div>}
      </div>

      {expanded && (
      <>
      <div className="text-[9px] text-[#4a4660] mt-1.5">
        {formatDate(challenge.start_date, language)} – {formatDate(challenge.end_date, language)}
      </div>

      {/* Day grids */}
      <div className="mt-1.5" />
      {isShared && challenge.participants ? (() => {
        const me = challenge.participants.find(p => p.user_id === userId);
        const others = challenge.participants.filter(p => p.user_id !== userId);

        const renderParticipant = (participant: typeof challenge.participants[0], isMe: boolean) => {
          const pFailed = participant.failed_days || [];
          const joinDate = participant.user_id !== challenge.user_id ? participant.joined_at?.slice(0, 10) : challenge.start_date;
          const startFrom = joinDate || challenge.start_date;
          const endRef = isActive ? today : challenge.end_date;
          const elapsed = Math.max(0, Math.ceil((new Date(endRef + 'T00:00:00').getTime() - new Date(startFrom + 'T00:00:00').getTime()) / (1000 * 60 * 60 * 24)) + 1);
          const failedCount = pFailed.filter(d => d >= startFrom && d <= endRef).length;
          const passedCount = elapsed - failedCount;
          const canRemove = !isMe && isOwner && isActive && participant.user_id !== challenge.user_id && onRemoveParticipant;
          return (
            <div key={participant.id}>
              <div className="flex items-center gap-1 text-[9px] text-[#7a7890] mb-0.5">
                <span className="truncate">
                  {isMe ? t.common.you : getParticipantLabel(participant.display_name, participant.email)}
                </span>
                <span className="shrink-0">
                  (<span className="text-[#ec4899]">{passedCount}</span>/<span className="text-amber-400">{failedCount}</span>)
                </span>
                {canRemove && (
                  <button
                    onClick={() => onRemoveParticipant(participant.user_id)}
                    className="p-0.5 rounded text-[#7a7890] hover:text-red-400 hover:bg-red-400/10 transition-colors shrink-0"
                    title={t.challenges.removeParticipant}
                  >
                    <X size={9} />
                  </button>
                )}
              </div>
              <DayGrid
                days={days}
                failedDays={pFailed}
                today={today}
                isActive={isActive}
                clickable={isMe && isActive}
                onToggleDay={isMe && isActive ? onToggleDay : undefined}
                joinedAt={participant.user_id !== challenge.user_id ? participant.joined_at : undefined}
              />
            </div>
          );
        };

        return (
          <div className="space-y-1.5 mb-2">
            {me && renderParticipant(me, true)}
            {others.length > 0 && (
              <details>
                <summary className="text-[9px] text-[#4a4660] cursor-pointer hover:text-[#7a7890] transition-colors list-none">
                  +{others.length} {t.common.participants}
                </summary>
                <div className="space-y-1.5 mt-1.5">
                  {others.map(p => renderParticipant(p, false))}
                </div>
              </details>
            )}
            {/* Legend */}
            {showLegend && (
              <div className="flex items-center gap-2 mt-0.5">
                <span className="flex items-center gap-0.5 text-[9px] text-[#4a4660]">
                  <span className="w-[6px] h-[6px] rounded-[1px] bg-[#ec4899]" /> {t.challenges.passed}
                </span>
                <span className="flex items-center gap-0.5 text-[9px] text-[#4a4660]">
                  <span className="w-[6px] h-[6px] rounded-[1px] bg-amber-400" /> {t.challenges.failed}
                </span>
                <span className="flex items-center gap-0.5 text-[9px] text-[#4a4660]">
                  <span className="w-[6px] h-[6px] rounded-[1px] bg-white/[0.15]" /> {t.challenges.upcoming}
                </span>
                <span className="flex items-center gap-0.5 text-[9px] text-[#4a4660]">
                  <span className="w-[6px] h-[6px] rounded-[1px] bg-[#1c1928]" style={{ backgroundImage: 'repeating-linear-gradient(135deg, transparent, transparent 2px, rgba(255,255,255,0.07) 2px, rgba(255,255,255,0.07) 3px)' }} /> {t.challenges.beforeJoin}
                </span>
              </div>
            )}
          </div>
        );
      })() : (
        <div className="mb-2">
          {(() => {
            const endRef = isActive ? today : challenge.end_date;
            const elapsed = Math.max(0, Math.ceil((new Date(endRef + 'T00:00:00').getTime() - new Date(challenge.start_date + 'T00:00:00').getTime()) / (1000 * 60 * 60 * 24)) + 1);
            const failedCount = myFailedDays.filter(d => d >= challenge.start_date && d <= endRef).length;
            const passedCount = elapsed - failedCount;
            return (
              <div className="text-[9px] text-[#7a7890] mb-0.5">
                <span className="text-[#ec4899]">{passedCount}</span>/<span className="text-amber-400">{failedCount}</span>
              </div>
            );
          })()}
          <DayGrid
            days={days}
            failedDays={myFailedDays}
            today={today}
            isActive={isActive}
            clickable={isActive}
            onToggleDay={isActive ? onToggleDay : undefined}
          />
          {showLegend && (
            <div className="flex items-center gap-2 mt-0.5">
              <span className="flex items-center gap-0.5 text-[9px] text-[#4a4660]">
                <span className="w-[6px] h-[6px] rounded-[1px] bg-[#ec4899]" /> {t.challenges.passed}
              </span>
              <span className="flex items-center gap-0.5 text-[9px] text-[#4a4660]">
                <span className="w-[6px] h-[6px] rounded-[1px] bg-amber-400" /> {t.challenges.failed}
              </span>
              <span className="flex items-center gap-0.5 text-[9px] text-[#4a4660]">
                <span className="w-[6px] h-[6px] rounded-[1px] bg-white/[0.15]" /> {t.challenges.upcoming}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Invite code display */}
      {showInviteCode && inviteCode && (
        <div className="flex items-center gap-1.5 mb-2 p-2 rounded-md bg-[#0c0a12] border border-[#1c1928]">
          <span className="text-[12px] font-mono font-medium text-white tracking-widest flex-1">{inviteCode}</span>
          <button
            onClick={handleCopyCode}
            className="flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] text-[#7a7890] hover:text-white transition-colors"
          >
            <Copy size={10} />
            {copied ? t.common.copied : t.common.copy}
          </button>
        </div>
      )}

      {/* Extend inline */}
      {extending && (
        <div className="flex items-center gap-1.5 mb-2">
          <input
            type="date"
            value={newEndDate}
            onChange={e => setNewEndDate(e.target.value)}
            min={today}
            className="flex-1 px-2 py-1 bg-[#0c0a12] border border-[#1c1928] rounded text-[11px] text-[#e0dfe4] outline-none focus:border-[#2d2a40] [color-scheme:dark]"
          />
          <button
            onClick={handleExtend}
            disabled={!newEndDate || newEndDate === challenge.end_date || newEndDate < today}
            className="px-2 py-1 text-[11px] font-medium text-white bg-[#ec4899] hover:bg-[#db2777] rounded transition-colors disabled:opacity-50"
          >
            {t.common.save}
          </button>
          <button
            onClick={() => { setExtending(false); setNewEndDate(challenge.end_date); }}
            className="px-1 py-1 text-[11px] text-[#7a7890] hover:text-white transition-colors"
          >
            {t.common.cancel}
          </button>
        </div>
      )}

      {/* Reactivate inline */}
      {reactivating && (
        <div className="flex items-center gap-1.5 mb-2">
          <input
            type="date"
            value={reactivateEndDate}
            onChange={e => setReactivateEndDate(e.target.value)}
            min={today}
            className="flex-1 px-2 py-1 bg-[#0c0a12] border border-[#1c1928] rounded text-[11px] text-[#e0dfe4] outline-none focus:border-[#2d2a40] [color-scheme:dark]"
          />
          <button
            onClick={() => { if (reactivateEndDate >= today) { onReactivate?.(reactivateEndDate); setReactivating(false); } }}
            disabled={!reactivateEndDate || reactivateEndDate < today}
            className="px-2 py-1 text-[11px] font-medium text-white bg-[#ec4899] hover:bg-[#db2777] rounded transition-colors disabled:opacity-50"
          >
            {t.challenges.reactivate}
          </button>
          <button
            onClick={() => setReactivating(false)}
            className="px-1 py-1 text-[11px] text-[#7a7890] hover:text-white transition-colors"
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
