import { useInit } from './InitContext';

// ApprovalProvider is replaced by InitProvider in App.tsx
// This file only exports the hook for backwards compatibility
export function useApproval() {
  const { isApproved, loading } = useInit();
  return { isApproved, loading };
}
