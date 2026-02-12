import { useState, ReactNode } from 'react';
import Sidebar from './Sidebar';

export default function Layout({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="h-screen flex bg-[#0c0a12] p-3 gap-3">
      <Sidebar open={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
