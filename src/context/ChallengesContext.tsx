import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { Challenge } from '../types';
import { useAuth } from './AuthContext';
import * as api from '../lib/challenges';

interface ChallengesContextType {
  challenges: Challenge[];
  loading: boolean;
  error: string | null;
  createChallenge: (data: Pick<Challenge, 'name' | 'start_date' | 'end_date'>) => Promise<void>;
  updateChallenge: (id: string, updates: Partial<Pick<Challenge, 'name' | 'start_date' | 'end_date' | 'status'>>) => Promise<void>;
  deleteChallenge: (id: string) => Promise<void>;
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

  const updateChallenge = async (id: string, updates: Partial<Pick<Challenge, 'name' | 'start_date' | 'end_date' | 'status'>>) => {
    const updated = await api.updateChallenge(id, updates);
    setChallenges(prev => prev.map(c => c.id === id ? updated : c));
  };

  const deleteChallenge = async (id: string) => {
    await api.deleteChallenge(id);
    setChallenges(prev => prev.filter(c => c.id !== id));
  };

  return (
    <ChallengesContext.Provider value={{
      challenges, loading, error,
      createChallenge, updateChallenge, deleteChallenge, refresh,
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
