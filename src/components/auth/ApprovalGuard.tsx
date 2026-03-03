import { ReactNode } from 'react';
import { useApproval } from '../../context/ApprovalContext';
import WaitingRoomPage from '../../pages/WaitingRoomPage';

export default function ApprovalGuard({ children }: { children: ReactNode }) {
  const { isApproved, loading } = useApproval();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0c0a12] flex items-center justify-center">
        <div className="text-[#7a7890] text-[14px]">Loading...</div>
      </div>
    );
  }

  if (!isApproved) return <WaitingRoomPage />;

  return <>{children}</>;
}
