import { useState } from 'react';
import { StickyNote, LogOut, ChevronLeft, ChevronRight, ChevronUp, Plus, Shield, Umbrella, RepeatIcon, Settings, PanelRight } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCollections } from '../../context/CollectionsContext';
import { getCollectionIcon } from '../../lib/icons';
import { useGravatar } from '../../hooks/useGravatar';
import { useAdmin } from '../../context/AdminContext';
import CreateCollectionModal from '../collections/CreateCollectionModal';
import SettingsModal, { loadMenuSettings, type MenuSettings } from './SettingsModal';

interface SidebarProps {
  open: boolean;
  onToggle: () => void;
  onClose?: () => void;
  isMobile?: boolean;
}

export default function Sidebar({ open, onToggle, onClose, isMobile }: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { collections } = useCollections();
  const { isAdmin } = useAdmin();
  const avatarUrl = useGravatar(user?.email ?? undefined, 64);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [createCollectionOpen, setCreateCollectionOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [menuSettings, setMenuSettings] = useState<MenuSettings>(loadMenuSettings);
  const [extensionModalOpen, setExtensionModalOpen] = useState(false);

  const isChrome = /Chrome/.test(navigator.userAgent) && !/Edg/.test(navigator.userAgent);

  const handleNav = (path: string) => {
    navigate(path);
    onClose?.();
  };

  return (
    <div className="relative shrink-0 flex">
      <aside
        className={`flex flex-col transition-all duration-200 overflow-hidden bg-[#1a1726] border border-[#0c0a12] ${
          isMobile ? 'w-[240px] h-screen rounded-none' : `rounded-xl ${open ? 'w-[200px]' : 'w-[52px]'}`
        }`}
      >
        {/* Logo */}
        <div className={`pt-8 pb-8 ${open ? 'px-6' : 'px-0 flex justify-center'}`}>
          {open ? (
            <h1 className="text-[26px] font-bold text-white tracking-tight whitespace-nowrap">
              petek<span className="text-[#ec4899]">.</span>
            </h1>
          ) : (
            <span className="text-[26px] font-bold text-[#ec4899]">.</span>
          )}
        </div>

        {/* Nav */}
        <nav className={`flex-1 space-y-1 ${open ? 'px-4' : 'px-2'}`}>
          {menuSettings.notes && (
            <NavItem icon={StickyNote} label="Notes" active={location.pathname === '/' || location.pathname === '/archive'} onClick={() => handleNav('/')} collapsed={!open} />
          )}
          {menuSettings.insurances && (
            <NavItem icon={Umbrella} label="Insurances" active={location.pathname === '/insurances'} onClick={() => handleNav('/insurances')} collapsed={!open} />
          )}
          {menuSettings.subscriptions && (
            <NavItem icon={RepeatIcon} label="Subscriptions" active={location.pathname === '/subscriptions'} onClick={() => handleNav('/subscriptions')} collapsed={!open} />
          )}

          {/* Collections */}
          {menuSettings.collections && (
            <>
              {collections.length > 0 && (
                <div className={`mt-4 pt-4 border-t border-white/[0.06] space-y-1`}>
                  {open && (
                    <div className="flex items-center justify-between px-3 mb-1">
                      <span className="text-[11px] font-medium text-[#7a7890] uppercase tracking-wider">Collections</span>
                      <button
                        onClick={() => setCreateCollectionOpen(true)}
                        className="text-[#7a7890] hover:text-[#ec4899] transition-colors"
                        title="New collection"
                      >
                        <Plus size={12} />
                      </button>
                    </div>
                  )}
                  {collections.map(col => {
                    const ColIcon = getCollectionIcon(col.icon);
                    return (
                      <NavItem
                        key={col.id}
                        icon={ColIcon}
                        label={col.name}
                        active={location.pathname === `/c/${col.slug}`}
                        onClick={() => handleNav(`/c/${col.slug}`)}
                        collapsed={!open}
                      />
                    );
                  })}
                </div>
              )}
              {collections.length === 0 && open && (
                <div className="mt-4 pt-4 border-t border-white/[0.06]">
                  <button
                    onClick={() => setCreateCollectionOpen(true)}
                    className="w-full flex items-center gap-3 px-3 py-2 text-[13px] text-[#7a7890] hover:text-[#ec4899] transition-colors rounded-lg"
                  >
                    <Plus size={16} className="shrink-0" />
                    <span>New Collection</span>
                  </button>
                </div>
              )}
              {collections.length === 0 && !open && (
                <div className="mt-4 pt-4 border-t border-white/[0.06]">
                  <button
                    onClick={() => setCreateCollectionOpen(true)}
                    className="w-full flex justify-center py-2 text-[#7a7890] hover:text-[#ec4899] transition-colors rounded-lg"
                    title="New collection"
                  >
                    <Plus size={16} />
                  </button>
                </div>
              )}
            </>
          )}
        </nav>

        {/* Admin */}
        {isAdmin && (
          <div className={`${open ? 'px-4' : 'px-2'} mb-1`}>
            <NavItem icon={Shield} label="Admin" active={location.pathname === '/admin'} onClick={() => handleNav('/admin')} collapsed={!open} />
          </div>
        )}

        {/* User trigger */}
        <div className={`pb-4 border-t border-white/[0.06] pt-4 mt-2 ${open ? 'px-4' : 'px-2'}`}>
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className={`w-full flex items-center rounded-lg hover:bg-white/[0.04] transition-colors ${
              open ? 'gap-3 px-3 py-2' : 'justify-center py-2'
            }`}
            title={user?.email ?? 'User'}
          >
            {avatarUrl ? (
              <img src={avatarUrl} alt="" className="w-7 h-7 rounded-full shrink-0" />
            ) : (
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#ec4899] to-[#8b5cf6] flex items-center justify-center text-[10px] font-bold text-white shrink-0">
                {user?.email?.[0]?.toUpperCase() ?? '?'}
              </div>
            )}
            {open && (
              <>
                <span className="text-[12px] text-[#b0adc0] truncate flex-1 text-left">{user?.email}</span>
                <ChevronUp size={12} className="shrink-0 text-[#7a7890]" />
              </>
            )}
          </button>
        </div>
      </aside>

      {/* User popover — outside aside to avoid overflow clipping */}
      {userMenuOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
          <div className={`absolute z-50 bg-[#1e1b2e] border border-[#3a3650] rounded-lg shadow-xl py-1 w-36 ${
            open ? 'bottom-4 left-[208px]' : 'bottom-4 left-14'
          }`}>
            <button
              onClick={() => { setSettingsOpen(true); setUserMenuOpen(false); }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-[13px] text-[#c0bfd0] hover:bg-white/[0.08] hover:text-white transition-colors rounded-lg"
            >
              <Settings size={14} />
              <span>Settings</span>
            </button>
            {isChrome && (
              <button
                onClick={() => { setExtensionModalOpen(true); setUserMenuOpen(false); }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-[13px] text-[#c0bfd0] hover:bg-white/[0.08] hover:text-white transition-colors rounded-lg"
              >
                <PanelRight size={14} />
                <span>Extension</span>
              </button>
            )}
            <button
              onClick={() => { signOut(); setUserMenuOpen(false); }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-[13px] text-[#c0bfd0] hover:bg-white/[0.08] hover:text-white transition-colors rounded-lg"
            >
              <LogOut size={14} />
              <span>Sign out</span>
            </button>
          </div>
        </>
      )}

      {/* Collapse button — outside aside so it's never clipped (hidden on mobile) */}
      {!isMobile && (
        <button
          onClick={onToggle}
          className="absolute -right-3 top-1/2 -translate-y-1/2 z-10 w-6 h-6 rounded-full bg-[#1a1726] border border-[#0c0a12] flex items-center justify-center text-[#6b6882] hover:text-white hover:border-[#ec4899]/60 transition-colors"
        >
          {open ? <ChevronLeft size={12} /> : <ChevronRight size={12} />}
        </button>
      )}

      <CreateCollectionModal open={createCollectionOpen} onClose={() => setCreateCollectionOpen(false)} />
      <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} settings={menuSettings} onChange={setMenuSettings} />
      {extensionModalOpen && (
        <ExtensionModal onClose={() => setExtensionModalOpen(false)} />
      )}
    </div>
  );
}

function ExtensionModal({ onClose }: { onClose: () => void }) {
  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/60" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div className="bg-[#13111c] border border-[#1c1928] rounded-xl shadow-2xl w-full max-w-sm p-6 pointer-events-auto">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-[#1a1726] flex items-center justify-center">
              <PanelRight size={20} className="text-[#ec4899]" />
            </div>
            <div>
              <h2 className="text-white font-semibold text-base">Petek Notes Extension</h2>
              <p className="text-[#7a7890] text-xs">Quick access from Chrome sidebar</p>
            </div>
          </div>

          <div className="space-y-3 text-[13px] text-[#b0adc0]">
            <p>Access your notes directly from Chrome's side panel without leaving your current tab.</p>

            <ol className="space-y-2 list-decimal list-inside text-[#7a7890]">
              <li>Download and unzip the <a href="https://github.com/yevgeniy-ovsyannikov/petek/releases" target="_blank" rel="noopener" className="text-[#ec4899] hover:underline">latest release</a></li>
              <li>Open <code className="px-1.5 py-0.5 bg-white/5 rounded text-[#b0adc0] text-xs">chrome://extensions</code></li>
              <li>Enable <span className="text-[#b0adc0]">Developer mode</span> (top right)</li>
              <li>Click <span className="text-[#b0adc0]">Load unpacked</span> → select the unzipped folder</li>
              <li>Click the extension icon to open the side panel</li>
            </ol>

            <p className="text-xs text-[#4a4660]">Your session syncs automatically — no need to sign in again.</p>
          </div>

          <button
            onClick={onClose}
            className="mt-5 w-full py-2 bg-[#1a1726] hover:bg-[#1e1b2e] text-white text-sm font-medium rounded-lg transition-colors"
          >
            Got it
          </button>
        </div>
      </div>
    </>
  );
}

function NavItem({ label, icon: Icon, active, onClick, collapsed }: {
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  active: boolean;
  onClick: () => void;
  collapsed: boolean;
}) {
  return (
    <button
      onClick={onClick}
      title={label}
      className={`w-full flex items-center rounded-lg text-[15px] transition-all ${
        collapsed ? 'justify-center py-3' : 'gap-3 px-3 py-3'
      } ${
        active
          ? 'bg-[#1a1730] text-white font-medium'
          : 'text-[#7a7890] hover:bg-white/[0.04] hover:text-[#b0adc0]'
      }`}
    >
      <Icon size={18} className={`shrink-0 ${active ? 'text-[#ec4899]' : ''}`} />
      {!collapsed && <span>{label}</span>}
    </button>
  );
}

