import { useState, useRef, useEffect } from 'react';
import { Plus, X, Check, Pencil } from 'lucide-react';
import { useInsurances } from '../../context/InsurancesContext';

export default function InsuranceProfileTabs() {
  const {
    profiles,
    activeProfileId,
    setActiveProfileId,
    addProfile,
    renameProfile,
    removeProfile,
    allPolicies,
  } = useInsurances();

  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const addInputRef = useRef<HTMLInputElement>(null);
  const editInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (adding) addInputRef.current?.focus();
  }, [adding]);

  useEffect(() => {
    if (editingId) editInputRef.current?.focus();
  }, [editingId]);

  const handleAdd = async () => {
    const name = newName.trim();
    if (!name) return;
    await addProfile(name);
    setNewName('');
    setAdding(false);
  };

  const handleRename = async () => {
    const name = editName.trim();
    if (!name || !editingId) return;
    await renameProfile(editingId, name);
    setEditingId(null);
    setEditName('');
  };

  const handleDelete = async (id: string) => {
    await removeProfile(id);
    setConfirmDeleteId(null);
  };

  const getPolicyCount = (profileId: string) =>
    allPolicies.filter(p => p.profile_id === profileId).length;

  return (
    <div className="flex items-center gap-1 mb-6 overflow-x-auto pb-1 scrollbar-hide">
      {/* All tab */}
      <button
        onClick={() => setActiveProfileId(null)}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-medium whitespace-nowrap transition-all ${
          activeProfileId === null
            ? 'bg-[#1a1730] text-white border border-[#ec4899]/30'
            : 'text-[#7a7890] hover:text-white hover:bg-white/[0.04] border border-transparent'
        }`}
      >
        All
        <span className={`text-[11px] ${activeProfileId === null ? 'text-[#ec4899]' : 'text-[#4a4660]'}`}>
          {allPolicies.length}
        </span>
      </button>

      {/* Separator */}
      <div className="w-px h-5 bg-[#1c1928] mx-1" />

      {/* Profile tabs */}
      {profiles.map(profile => (
        <div key={profile.id} className="relative group flex items-center">
          {editingId === profile.id ? (
            <div className="flex items-center gap-1 px-2 py-1.5 rounded-lg bg-[#1a1730] border border-[#ec4899]/30">
              <input
                ref={editInputRef}
                value={editName}
                onChange={e => setEditName(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') handleRename();
                  if (e.key === 'Escape') { setEditingId(null); setEditName(''); }
                }}
                className="bg-transparent text-[13px] text-white outline-none w-20"
                maxLength={20}
              />
              <button
                onClick={handleRename}
                className="p-0.5 text-[#ec4899] hover:text-white transition-colors"
              >
                <Check size={12} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setActiveProfileId(profile.id)}
              onDoubleClick={() => {
                setEditingId(profile.id);
                setEditName(profile.name);
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-medium whitespace-nowrap transition-all ${
                activeProfileId === profile.id
                  ? 'bg-[#1a1730] text-white border border-[#ec4899]/30'
                  : 'text-[#7a7890] hover:text-white hover:bg-white/[0.04] border border-transparent'
              }`}
            >
              {profile.name}
              <span className={`text-[11px] ${activeProfileId === profile.id ? 'text-[#ec4899]' : 'text-[#4a4660]'}`}>
                {getPolicyCount(profile.id)}
              </span>
            </button>
          )}

          {/* Edit/delete actions — visible on hover or when active */}
          {editingId !== profile.id && (
            <div className={`flex items-center gap-0.5 ml-0 ${
              activeProfileId === profile.id ? 'opacity-60 hover:opacity-100' : 'opacity-0 group-hover:opacity-60 hover:!opacity-100'
            } transition-opacity`}>
              <button
                onClick={() => {
                  setEditingId(profile.id);
                  setEditName(profile.name);
                }}
                className="p-1 text-[#7a7890] hover:text-white transition-colors"
                title="Rename"
              >
                <Pencil size={11} />
              </button>
              {profiles.length > 1 && (
                confirmDeleteId === profile.id ? (
                  <button
                    onClick={() => handleDelete(profile.id)}
                    className="p-1 text-red-400 hover:text-red-300 transition-colors text-[10px] font-medium"
                    onBlur={() => setConfirmDeleteId(null)}
                  >
                    Delete?
                  </button>
                ) : (
                  <button
                    onClick={() => setConfirmDeleteId(profile.id)}
                    className="p-1 text-[#7a7890] hover:text-red-400 transition-colors"
                    title="Delete"
                  >
                    <X size={11} />
                  </button>
                )
              )}
            </div>
          )}
        </div>
      ))}

      {/* Add profile button / input */}
      {adding ? (
        <div className="flex items-center gap-1 px-2 py-1.5 rounded-lg bg-[#1a1730] border border-[#ec4899]/30">
          <input
            ref={addInputRef}
            value={newName}
            onChange={e => setNewName(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') handleAdd();
              if (e.key === 'Escape') { setAdding(false); setNewName(''); }
            }}
            placeholder="Name..."
            className="bg-transparent text-[13px] text-white placeholder-[#4a4660] outline-none w-20"
            maxLength={20}
          />
          <button
            onClick={handleAdd}
            disabled={!newName.trim()}
            className="p-0.5 text-[#ec4899] hover:text-white transition-colors disabled:opacity-30"
          >
            <Check size={12} />
          </button>
          <button
            onClick={() => { setAdding(false); setNewName(''); }}
            className="p-0.5 text-[#7a7890] hover:text-white transition-colors"
          >
            <X size={12} />
          </button>
        </div>
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-[13px] text-[#7a7890] hover:text-[#ec4899] hover:bg-white/[0.04] border border-dashed border-[#1c1928] hover:border-[#ec4899]/30 transition-all"
        >
          <Plus size={14} />
          Add
        </button>
      )}
    </div>
  );
}
