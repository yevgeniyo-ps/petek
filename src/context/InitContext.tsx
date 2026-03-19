import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { checkIsApproved, checkIsAdmin, fetchMyFeatures } from '../lib/admin';
import { useAuth } from './AuthContext';
import { InitFeaturesContext } from './FeaturesContext';

const DEV_BYPASS_AUTH = import.meta.env.VITE_DEV_BYPASS_AUTH === 'true';
const ALL_FEATURES = ['notes', 'challenges', 'insurances', 'subscriptions', 'collections'];

interface InitState {
  isApproved: boolean;
  isAdmin: boolean;
  features: string[];
  loading: boolean;
}

interface InitContextType extends InitState {
  hasFeature: (name: string) => boolean;
}

const InitContext = createContext<InitContextType | undefined>(undefined);

export function InitProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [state, setState] = useState<InitState>({
    isApproved: DEV_BYPASS_AUTH,
    isAdmin: DEV_BYPASS_AUTH,
    features: DEV_BYPASS_AUTH ? ALL_FEATURES : [],
    loading: !DEV_BYPASS_AUTH,
  });

  const userId = user?.id;

  useEffect(() => {
    if (DEV_BYPASS_AUTH) return;

    if (!userId) {
      setState({ isApproved: false, isAdmin: false, features: [], loading: false });
      return;
    }

    setState(prev => ({ ...prev, loading: true }));

    // All 3 checks in parallel — saves 2 round trips
    Promise.all([
      checkIsApproved(),
      checkIsAdmin(),
      fetchMyFeatures(),
    ]).then(([isApproved, isAdmin, features]) => {
      setState({ isApproved, isAdmin, features, loading: false });
    });
  }, [userId]);

  const hasFeature = (name: string) => state.features.includes(name);
  const value = { ...state, hasFeature };

  return (
    <InitContext.Provider value={value}>
      <InitFeaturesContext.Provider value={{ features: state.features, loading: state.loading, hasFeature }}>
        {children}
      </InitFeaturesContext.Provider>
    </InitContext.Provider>
  );
}

export function useInit() {
  const context = useContext(InitContext);
  if (!context) throw new Error('useInit must be used within InitProvider');
  return context;
}
