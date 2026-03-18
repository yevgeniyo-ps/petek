import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { Challenge } from '../types';
import { useAuth } from './AuthContext';
import * as api from '../lib/challenges';

interface ChallengesContextType {
  challenges: Challenge[];
  loading: boolean;
  error: string | null;
  createChallenge: (data: Pick<Challenge, 'name' | 'start_date' | 'end_date'>) => Promise<void>;
  updateChallenge: (id: string, updates: Partial<Pick<Challenge, 'name' | 'start_date' | 'end_date' | 'status' | 'failed_days'>>) => Promise<void>;
  deleteChallenge: (id: string) => Promise<void>;
  generateInviteCode: (challengeId: string) => Promise<string>;
  joinChallenge: (inviteCode: string) => Promise<void>;
  toggleFailedDay: (challengeId: string, day: string) => void;
  leaveChallenge: (challengeId: string) => Promise<void>;
  removeParticipant: (challengeId: string, participantUserId: string) => Promise<void>;
  refresh: () => Promise<void>;
}

const ChallengesContext = createContext<ChallengesContextType | undefined>(undefined);

export function ChallengesProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!user) return;
    try {
      setError(null);
      const data = await api.fetchChallenges();
      setChallenges(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load challenges');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      refresh();
    } else {
      setChallenges([]);
      setLoading(false);
    }
  }, [user, refresh]);

  const createChallenge = async (data: Pick<Challenge, 'name' | 'start_date' | 'end_date'>) => {
    const created = await api.createChallenge(data);
    setChallenges(prev => [created, ...prev]);
  };

  const updateChallenge = async (id: string, updates: Partial<Pick<Challenge, 'name' | 'start_date' | 'end_date' | 'status' | 'failed_days'>>) => {
    const updated = await api.updateChallenge(id, updates);
    setChallenges(prev => prev.map(c => c.id === id ? { ...c, ...updated } : c));
  };

  const deleteChallenge = async (id: string) => {
    await api.deleteChallenge(id);
    setChallenges(prev => prev.filter(c => c.id !== id));
  };

  const generateInviteCode = async (challengeId: string): Promise<string> => {
    const code = await api.generateInviteCode(challengeId);
    await refresh();
    return code;
  };

  const joinChallenge = async (inviteCode: string) => {
    await api.joinChallenge(inviteCode);
    await refresh();
  };

  const toggleFailedDay = (challengeId: string, day: string) => {
    const challenge = challenges.find(c => c.id === challengeId);
    if (!challenge) return;

    if (challenge.invite_code && challenge.participants && user) {
      // Shared challenge: update participant row
      const participant = challenge.participants.find(p => p.user_id === user.id);
      if (!participant) return;
      const failedDays = participant.failed_days || [];
      const newFailedDays = failedDays.includes(day)
        ? failedDays.filter(d => d !== day)
        : [...failedDays, day];

      // Optimistic update
      setChallenges(prev => prev.map(c => {
        if (c.id !== challengeId) return c;
        return {
          ...c,
          participants: c.participants?.map(p =>
            p.id === participant.id ? { ...p, failed_days: newFailedDays } : p
          ),
        };
      }));
      api.updateParticipantFailedDays(participant.id, newFailedDays);
    } else {
      // Private challenge: update challenge directly
      const failedDays = challenge.failed_days || [];
      const newFailedDays = failedDays.includes(day)
        ? failedDays.filter(d => d !== day)
        : [...failedDays, day];
      updateChallenge(challengeId, { failed_days: newFailedDays });
    }
  };

  const leaveChallenge = async (challengeId: string) => {
    await api.leaveChallenge(challengeId);
    setChallenges(prev => prev.filter(c => c.id !== challengeId));
  };

  const removeParticipant = async (challengeId: string, participantUserId: string) => {
    await api.removeParticipant(challengeId, participantUserId);
    setChallenges(prev => prev.map(c =>
      c.id === challengeId
        ? { ...c, participants: c.participants?.filter(p => p.user_id !== participantUserId) }
        : c
    ));
  };

  return (
    <ChallengesContext.Provider value={{
      challenges, loading, error,
      createChallenge, updateChallenge, deleteChallenge,
      generateInviteCode, joinChallenge, toggleFailedDay, leaveChallenge,
      removeParticipant, refresh,
    }}>
      {children}
    </ChallengesContext.Provider>
  );
}

export function useChallenges() {
  const context = useContext(ChallengesContext);
  if (!context) throw new Error('useChallenges must be used within ChallengesProvider');
  return context;
}
