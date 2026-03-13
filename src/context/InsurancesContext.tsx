import { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from 'react';
import { InsurancePolicy, InsuranceProfile } from '../types';
import { useAuth } from './AuthContext';
import { supabase } from '../config/supabase';
import * as api from '../lib/insurances';
import * as profilesApi from '../lib/insurance-profiles';

interface InsurancesContextType {
  // Profiles
  profiles: InsuranceProfile[];
  activeProfileId: string | null;
  setActiveProfileId: (id: string | null) => void;
  addProfile: (name: string) => Promise<void>;
  renameProfile: (id: string, name: string) => Promise<void>;
  removeProfile: (id: string) => Promise<void>;

  // Policies
  allPolicies: InsurancePolicy[];
  policies: InsurancePolicy[]; // filtered by active profile (or all if null)
  loading: boolean;
  uploading: boolean;
  lastUploadDate: string | null;
  replacePolicies: (policies: Omit<InsurancePolicy, 'id' | 'user_id' | 'created_at' | 'profile_id'>[]) => Promise<void>;
  clearProfilePolicies: () => Promise<void>;
  refresh: () => Promise<void>;
}

const InsurancesContext = createContext<InsurancesContextType | undefined>(undefined);

export function InsurancesProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [profiles, setProfiles] = useState<InsuranceProfile[]>([]);
  const [allPolicies, setAllPolicies] = useState<InsurancePolicy[]>([]);
  const [activeProfileId, setActiveProfileId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const loadData = useCallback(async () => {
    if (!user) return;
    try {
      const [profilesData, policiesData] = await Promise.all([
        profilesApi.fetchProfiles(),
        api.fetchInsurancePolicies(),
      ]);

      let finalProfiles = profilesData;

      // Auto-create default "Me" profile if none exist
      if (finalProfiles.length === 0) {
        const defaultProfile = await profilesApi.createProfile('Me', 0);
        finalProfiles = [defaultProfile];

        // Migrate any existing policies (without profile_id) to the default profile
        const orphanPolicies = policiesData.filter(p => !p.profile_id);
        if (orphanPolicies.length > 0) {
          const { error } = await supabase
            .from('insurance_policies')
            .update({ profile_id: defaultProfile.id })
            .is('profile_id', null);
          if (!error) {
            // Update local data
            for (const p of policiesData) {
              if (!p.profile_id) p.profile_id = defaultProfile.id;
            }
          }
        }
      }

      setProfiles(finalProfiles);
      setAllPolicies(policiesData);

      // Set active profile to first if not set
      setActiveProfileId(prev => {
        if (prev && finalProfiles.some(p => p.id === prev)) return prev;
        return finalProfiles[0]?.id ?? null;
      });
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      loadData();
    } else {
      setProfiles([]);
      setAllPolicies([]);
      setActiveProfileId(null);
      setLoading(false);
    }
  }, [user, loadData]);

  // Policies filtered by active profile
  const policies = useMemo(() => {
    if (!activeProfileId) return allPolicies; // "All" tab
    return allPolicies.filter(p => p.profile_id === activeProfileId);
  }, [allPolicies, activeProfileId]);

  const lastUploadDate = policies.length > 0
    ? policies.reduce((latest, p) => p.created_at > latest ? p.created_at : latest, policies[0]!.created_at)
    : null;

  const replacePolicies = async (newPolicies: Omit<InsurancePolicy, 'id' | 'user_id' | 'created_at' | 'profile_id'>[]) => {
    if (!activeProfileId) return;
    setUploading(true);
    try {
      const inserted = await api.replaceInsurancePolicies(newPolicies, activeProfileId);
      // Replace policies for this profile in allPolicies
      setAllPolicies(prev => [
        ...prev.filter(p => p.profile_id !== activeProfileId),
        ...inserted,
      ]);
    } finally {
      setUploading(false);
    }
  };

  const clearProfilePolicies = async () => {
    if (!activeProfileId) return;
    await api.deleteInsurancePoliciesByProfile(activeProfileId);
    setAllPolicies(prev => prev.filter(p => p.profile_id !== activeProfileId));
  };

  const addProfile = async (name: string) => {
    const maxOrder = profiles.reduce((max, p) => Math.max(max, p.display_order), -1);
    const profile = await profilesApi.createProfile(name, maxOrder + 1);
    setProfiles(prev => [...prev, profile]);
    setActiveProfileId(profile.id);
  };

  const renameProfile = async (id: string, name: string) => {
    await profilesApi.updateProfile(id, { name });
    setProfiles(prev => prev.map(p => p.id === id ? { ...p, name } : p));
  };

  const removeProfile = async (id: string) => {
    await profilesApi.deleteProfile(id);
    setProfiles(prev => prev.filter(p => p.id !== id));
    setAllPolicies(prev => prev.filter(p => p.profile_id !== id));
    // Switch to first remaining profile
    setActiveProfileId(prev => {
      if (prev === id) {
        const remaining = profiles.filter(p => p.id !== id);
        return remaining[0]?.id ?? null;
      }
      return prev;
    });
  };

  return (
    <InsurancesContext.Provider value={{
      profiles,
      activeProfileId,
      setActiveProfileId,
      addProfile,
      renameProfile,
      removeProfile,
      allPolicies,
      policies,
      loading,
      uploading,
      lastUploadDate,
      replacePolicies,
      clearProfilePolicies,
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
