import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { Subscription } from '../types';
import { useAuth } from './AuthContext';
import * as api from '../lib/subscriptions';

interface SubscriptionsContextType {
  subscriptions: Subscription[];
  loading: boolean;
  error: string | null;
  createSubscription: (sub: Omit<Subscription, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => Promise<void>;
  updateSubscription: (id: string, updates: Partial<Omit<Subscription, 'id' | 'user_id' | 'created_at' | 'updated_at'>>) => Promise<void>;
  deleteSubscription: (id: string) => Promise<void>;
  refresh: () => Promise<void>;
}

const SubscriptionsContext = createContext<SubscriptionsContextType | undefined>(undefined);

export function SubscriptionsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!user) return;
    try {
      setError(null);
      const data = await api.fetchSubscriptions();
      setSubscriptions(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load subscriptions');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      refresh();
    } else {
      setSubscriptions([]);
      setLoading(false);
    }
  }, [user, refresh]);

  const createSubscription = async (sub: Omit<Subscription, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    const created = await api.createSubscription(sub);
    setSubscriptions(prev => [created, ...prev]);
  };

  const updateSubscription = async (id: string, updates: Partial<Omit<Subscription, 'id' | 'user_id' | 'created_at' | 'updated_at'>>) => {
    const updated = await api.updateSubscription(id, updates);
    setSubscriptions(prev => prev.map(s => s.id === id ? updated : s));
  };

  const deleteSubscription = async (id: string) => {
    await api.deleteSubscription(id);
    setSubscriptions(prev => prev.filter(s => s.id !== id));
  };

  return (
    <SubscriptionsContext.Provider value={{
      subscriptions, loading, error,
      createSubscription, updateSubscription, deleteSubscription, refresh,
    }}>
      {children}
    </SubscriptionsContext.Provider>
  );
}

export function useSubscriptions() {
  const context = useContext(SubscriptionsContext);
  if (!context) throw new Error('useSubscriptions must be used within SubscriptionsProvider');
  return context;
}
