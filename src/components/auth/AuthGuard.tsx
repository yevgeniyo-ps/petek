import { ReactNode } from 'react';
import { useAuth } from '../../context/AuthContext';
import LoginPage from './LoginPage';

export default function AuthGuard({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0c0a12] flex items-center justify-center">
        <div className="text-[#7a7890] text-[14px]">Loading...</div>
      </div>
    );
  }

  if (!user) return <LoginPage />;

  return <>{children}</>;
}
