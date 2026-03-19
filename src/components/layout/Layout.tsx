import { useState, useEffect, ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { Menu } from 'lucide-react';
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
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const { pathname } = useLocation();
  useDocumentTitle();

  // Close mobile sidebar on navigation
  useEffect(() => {
    setMobileSidebarOpen(false);
  }, [pathname]);

  return (
    <div className="min-h-screen md:h-screen md:flex bg-[#0c0a12] md:p-3 md:gap-3">
      {/* Mobile hamburger */}
      <button
        onClick={() => setMobileSidebarOpen(true)}
        className="fixed left-4 z-40 md:hidden w-10 h-10 rounded-lg bg-[#1a1726] border border-[#0c0a12] flex items-center justify-center text-[#7a7890] hover:text-white transition-colors"
        style={{ top: 'calc(env(safe-area-inset-top, 0px) + 12px)' }}
      >
        <Menu size={20} />
      </button>

      {/* Desktop sidebar */}
      <div className="hidden md:block">
        <Sidebar open={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
      </div>

      {/* Mobile sidebar overlay */}
      {mobileSidebarOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/60 z-40 md:hidden"
            onClick={() => setMobileSidebarOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 z-50 md:hidden">
            <Sidebar open={true} onToggle={() => {}} onClose={() => setMobileSidebarOpen(false)} isMobile />
          </div>
        </>
      )}

      <main className="mobile-safe-top md:!pt-0 md:flex-1 md:overflow-y-auto pb-[env(safe-area-inset-bottom)]">
        {children}
      </main>
    </div>
  );
}
