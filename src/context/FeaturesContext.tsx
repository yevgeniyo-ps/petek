import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { fetchMyFeatures } from '../lib/admin';
import { useAuth } from './AuthContext';

const DEV_BYPASS_AUTH = import.meta.env.VITE_DEV_BYPASS_AUTH === 'true';

const ALL_FEATURES = ['notes', 'challenges', 'insurances', 'subscriptions', 'collections'];

interface FeaturesContextType {
  features: string[];
  hasFeature: (name: string) => boolean;
}

const FeaturesContext = createContext<FeaturesContextType | undefined>(undefined);

export function FeaturesProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [features, setFeatures] = useState<string[]>(DEV_BYPASS_AUTH ? ALL_FEATURES : []);

  useEffect(() => {
    if (DEV_BYPASS_AUTH) return;

    if (!user) {
      setFeatures([]);
      return;
    }
    fetchMyFeatures().then(setFeatures);
  }, [user]);

  const hasFeature = (name: string) => features.includes(name);

  return (
    <FeaturesContext.Provider value={{ features, hasFeature }}>
      {children}
    </FeaturesContext.Provider>
  );
}

export function useFeatures() {
  const context = useContext(FeaturesContext);
  if (!context) throw new Error('useFeatures must be used within FeaturesProvider');
  return context;
}
