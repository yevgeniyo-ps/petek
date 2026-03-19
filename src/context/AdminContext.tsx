import { useInit } from './InitContext';

// AdminProvider is replaced by InitProvider in App.tsx
// This file only exports the hook for backwards compatibility
export function useAdmin() {
  const { isAdmin } = useInit();
  return { isAdmin };
}
