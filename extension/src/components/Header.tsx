import { useExtAuth } from './LoginForm';
import { useGravatar } from '@shared/hooks/useGravatar';
import { LogOut } from 'lucide-react';

type View = 'notes' | 'archive';

interface HeaderProps {
  view: View;
  onViewChange: (view: View) => void;
}

const tabs: { key: View; label: string }[] = [
  { key: 'notes', label: 'Notes' },
  { key: 'archive', label: 'Archive' },
];

export function Header({ view, onViewChange }: HeaderProps) {
  const { user, signOut } = useExtAuth();

  const avatarUrl = useGravatar(user?.email ?? undefined, 48);

  return (
    <div className="flex-shrink-0 border-b border-[#1c1928]">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3">
        <h1 className="text-lg font-semibold text-white tracking-tight">
          petek<span className="text-pink-500">.</span>
        </h1>
        <div className="flex items-center gap-2">
          {avatarUrl && (
            <img
              src={avatarUrl}
              alt=""
              className="w-6 h-6 rounded-full opacity-70"
            />
          )}
          <button
            onClick={signOut}
            className="p-1.5 rounded-md text-[#7a7890] hover:text-white hover:bg-white/5 transition-colors"
            title="Sign out"
          >
            <LogOut size={14} />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex px-4 gap-1">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => onViewChange(tab.key)}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              view === tab.key
                ? 'bg-[#1a1730] text-white'
                : 'text-[#7a7890] hover:text-white hover:bg-white/5'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
}
