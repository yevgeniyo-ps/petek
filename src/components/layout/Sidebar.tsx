import { useState } from 'react';
import { StickyNote, Trash2, Archive, LogOut, ChevronLeft, ChevronRight, ChevronUp, Tag, Plus, X } from 'lucide-react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLabels } from '../../context/LabelsContext';
import { useCollections } from '../../context/CollectionsContext';
import { getCollectionIcon } from '../../lib/icons';
import { useGravatar } from '../../hooks/useGravatar';
import CreateCollectionModal from '../collections/CreateCollectionModal';

interface SidebarProps {
  open: boolean;
  onToggle: () => void;
}

export default function Sidebar({ open, onToggle }: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, signOut } = useAuth();
  const { labels, createLabel, deleteLabel } = useLabels();
  const { collections } = useCollections();
  const avatarUrl = useGravatar(user?.email ?? undefined, 64);
  const [newTagName, setNewTagName] = useState('');
  const [addingTag, setAddingTag] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [createCollectionOpen, setCreateCollectionOpen] = useState(false);
  const selectedTagId = searchParams.get('tag');

  const handleTagClick = (labelId: string) => {
    if (selectedTagId === labelId) {
      searchParams.delete('tag');
    } else {
      searchParams.set('tag', labelId);
    }
    setSearchParams(searchParams);
    if (location.pathname !== '/' && location.pathname !== '/archive') {
      navigate('/');
    }
  };

  const handleCreateTag = async () => {
    const name = newTagName.trim();
    if (!name) return;
    await createLabel(name);
    setNewTagName('');
    setAddingTag(false);
  };

  return (
    <div className="relative shrink-0 flex">
      <aside
        className={`flex flex-col transition-all duration-200 overflow-hidden rounded-xl bg-[#1a1726] border border-[#2a2740] ${
          open ? 'w-[200px]' : 'w-[52px]'
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
          <NavItem icon={StickyNote} label="Notes" active={location.pathname === '/'} onClick={() => navigate('/')} collapsed={!open} />
          <NavItem icon={Archive} label="Archive" active={location.pathname === '/archive'} onClick={() => navigate('/archive')} collapsed={!open} />
          <NavItem icon={Trash2} label="Trash" active={location.pathname === '/trash'} onClick={() => navigate('/trash')} collapsed={!open} />

          {/* Collections */}
          {collections.length > 0 && (
            <div className={`mt-4 pt-4 border-t border-white/[0.06] space-y-1 ${open ? '' : ''}`}>
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
                    onClick={() => navigate(`/c/${col.slug}`)}
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
        </nav>

        {/* Tags */}
        <div className={`rounded-lg bg-white/[0.03] border border-white/[0.04] py-2 ${open ? 'mx-3 px-1' : 'mx-1.5 px-0.5'}`}>
          {open && (
            <div className="flex items-center justify-between px-3 mb-1">
              <span className="text-[11px] font-medium text-[#7a7890] uppercase tracking-wider">Tags</span>
              <button
                onClick={() => setAddingTag(true)}
                className="text-[#7a7890] hover:text-[#ec4899] transition-colors"
                title="Add tag"
              >
                <Plus size={12} />
              </button>
            </div>
          )}
          {addingTag && open && (
            <div className="px-3 mb-1">
              <input
                autoFocus
                type="text"
                value={newTagName}
                onChange={e => setNewTagName(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') handleCreateTag();
                  if (e.key === 'Escape') { setAddingTag(false); setNewTagName(''); }
                }}
                onBlur={handleCreateTag}
                placeholder="Tag name..."
                className="w-full bg-transparent border border-[#2d2a40] rounded-md px-2 py-1 text-[12px] text-white placeholder-[#6b6882] outline-none focus:border-[#ec4899]/50"
              />
            </div>
          )}
          <div className="space-y-0.5">
            {labels.map(label => (
              <button
                key={label.id}
                onClick={() => handleTagClick(label.id)}
                title={label.name}
                className={`group/tag w-full flex items-center rounded-lg text-[14px] transition-all ${
                  open ? 'gap-3 px-3 py-2' : 'justify-center py-2'
                } ${
                  selectedTagId === label.id
                    ? 'bg-[#1a1730] text-white'
                    : 'text-[#7a7890] hover:bg-white/[0.04] hover:text-[#b0adc0]'
                }`}
              >
                <Tag size={16} className={`shrink-0 ${selectedTagId === label.id ? 'text-[#ec4899]' : ''}`} />
                {open && (
                  <>
                    <span className="truncate flex-1 text-left">{label.name}</span>
                    <X
                      size={12}
                      className="shrink-0 opacity-0 group-hover/tag:opacity-100 text-[#7a7890] hover:text-red-400 transition-all"
                      onClick={e => { e.stopPropagation(); deleteLabel(label.id); }}
                    />
                  </>
                )}
              </button>
            ))}
          </div>
        </div>

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
              onClick={() => { signOut(); setUserMenuOpen(false); }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-[13px] text-[#c0bfd0] hover:bg-white/[0.08] hover:text-white transition-colors rounded-lg"
            >
              <LogOut size={14} />
              <span>Sign out</span>
            </button>
          </div>
        </>
      )}

      {/* Collapse button — outside aside so it's never clipped */}
      <button
        onClick={onToggle}
        className="absolute -right-3 top-1/2 -translate-y-1/2 z-10 w-6 h-6 rounded-full bg-[#1a1726] border border-[#2a2740] flex items-center justify-center text-[#6b6882] hover:text-white hover:border-[#ec4899]/60 transition-colors"
      >
        {open ? <ChevronLeft size={12} /> : <ChevronRight size={12} />}
      </button>

      <CreateCollectionModal open={createCollectionOpen} onClose={() => setCreateCollectionOpen(false)} />
    </div>
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
