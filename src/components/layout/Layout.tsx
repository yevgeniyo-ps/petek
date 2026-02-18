import { useState, useEffect, ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { useCollections } from '../../context/CollectionsContext';
import Sidebar from './Sidebar';

function useDocumentTitle() {
  const { pathname } = useLocation();
  const { collections } = useCollections();

  useEffect(() => {
    let page = '';
    if (pathname === '/') page = 'Notes';
    else if (pathname === '/archive') page = 'Archive';
    else if (pathname === '/insurances') page = 'Insurances';
    else if (pathname === '/admin') page = 'Admin';
    else if (pathname.startsWith('/c/')) {
      const slug = pathname.slice(3);
      const col = collections.find(c => c.slug === slug);
      page = col?.name ?? 'Collection';
    }
    document.title = page ? `${page} — Petek` : 'Petek';
  }, [pathname, collections]);
}

export default function Layout({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  useDocumentTitle();

  return (
    <div className="h-screen flex bg-[#0c0a12] p-3 gap-3">
      <Sidebar open={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
