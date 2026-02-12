import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAdmin } from '../../context/AdminContext';

export default function AdminGuard({ children }: { children: ReactNode }) {
  const { isAdmin } = useAdmin();

  if (!isAdmin) return <Navigate to="/" replace />;

  return <>{children}</>;
}
