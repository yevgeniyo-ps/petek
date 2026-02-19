import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { checkIsApproved } from '../lib/admin';
import { useAuth } from './AuthContext';

const DEV_BYPASS_AUTH = import.meta.env.VITE_DEV_BYPASS_AUTH === 'true';

interface ApprovalContextType {
  isApproved: boolean;
  loading: boolean;
}

const ApprovalContext = createContext<ApprovalContextType | undefined>(undefined);

export function ApprovalProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [isApproved, setIsApproved] = useState(DEV_BYPASS_AUTH);
  const [loading, setLoading] = useState(!DEV_BYPASS_AUTH);

  useEffect(() => {
    if (DEV_BYPASS_AUTH) return;

    if (!user) {
      setIsApproved(false);
      setLoading(false);
      return;
    }
    checkIsApproved()
      .then(setIsApproved)
      .finally(() => setLoading(false));
  }, [user]);

  return (
    <ApprovalContext.Provider value={{ isApproved, loading }}>
      {children}
    </ApprovalContext.Provider>
  );
}

export function useApproval() {
  const context = useContext(ApprovalContext);
  if (!context) throw new Error('useApproval must be used within ApprovalProvider');
  return context;
}
