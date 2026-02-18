import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { InsurancePolicy } from '../types';
import { useAuth } from './AuthContext';
import * as api from '../lib/insurances';

interface InsurancesContextType {
  policies: InsurancePolicy[];
  loading: boolean;
  uploading: boolean;
  lastUploadDate: string | null;
  replacePolicies: (policies: Omit<InsurancePolicy, 'id' | 'user_id' | 'created_at'>[]) => Promise<void>;
  clearAll: () => Promise<void>;
  refresh: () => Promise<void>;
}

const InsurancesContext = createContext<InsurancesContextType | undefined>(undefined);

export function InsurancesProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [policies, setPolicies] = useState<InsurancePolicy[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const loadData = useCallback(async () => {
    if (!user) return;
    try {
      const data = await api.fetchInsurancePolicies();
      setPolicies(data);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      loadData();
    } else {
      setPolicies([]);
      setLoading(false);
    }
  }, [user, loadData]);

  const lastUploadDate = policies.length > 0
    ? policies.reduce((latest, p) => p.created_at > latest ? p.created_at : latest, policies[0]!.created_at)
    : null;

  const replacePolicies = async (newPolicies: Omit<InsurancePolicy, 'id' | 'user_id' | 'created_at'>[]) => {
    setUploading(true);
    try {
      const inserted = await api.replaceInsurancePolicies(newPolicies);
      setPolicies(inserted);
    } finally {
      setUploading(false);
    }
  };

  const clearAll = async () => {
    await api.deleteAllInsurancePolicies();
    setPolicies([]);
  };

  return (
    <InsurancesContext.Provider value={{
      policies,
      loading,
      uploading,
      lastUploadDate,
      replacePolicies,
      clearAll,
      refresh: loadData,
    }}>
      {children}
    </InsurancesContext.Provider>
  );
}

export function useInsurances() {
  const context = useContext(InsurancesContext);
  if (!context) throw new Error('useInsurances must be used within InsurancesProvider');
  return context;
}
