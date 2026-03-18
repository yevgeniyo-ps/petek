import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { fetchMyFeatures } from '../lib/admin';
import { useAuth } from './AuthContext';

const DEV_BYPASS_AUTH = import.meta.env.VITE_DEV_BYPASS_AUTH === 'true';

const ALL_FEATURES = ['notes', 'challenges', 'insurances', 'subscriptions', 'collections'];

interface FeaturesContextType {
  features: string[];
  loading: boolean;
  hasFeature: (name: string) => boolean;
}

const FeaturesContext = createContext<FeaturesContextType | undefined>(undefined);

export function FeaturesProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [features, setFeatures] = useState<string[]>(DEV_BYPASS_AUTH ? ALL_FEATURES : []);
  const [loading, setLoading] = useState(!DEV_BYPASS_AUTH);

  useEffect(() => {
    if (DEV_BYPASS_AUTH) return;

    if (!user) {
      setFeatures([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    fetchMyFeatures().then(f => { setFeatures(f); setLoading(false); });
  }, [user]);

  const hasFeature = (name: string) => features.includes(name);

  return (
    <FeaturesContext.Provider value={{ features, loading, hasFeature }}>
      {children}
    </FeaturesContext.Provider>
  );
}

export function useFeatures() {
  const context = useContext(FeaturesContext);
  if (!context) throw new Error('useFeatures must be used within FeaturesProvider');
  return context;
}
