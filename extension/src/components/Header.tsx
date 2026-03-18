import { useState } from 'react';
import { useExtAuth } from './LoginForm';
import { useGravatar } from '@shared/hooks/useGravatar';
import { useFeatures } from '@shared/context/FeaturesContext';
import { useLanguage, type Language } from '@shared/i18n';
import { LogOut, Globe } from 'lucide-react';

export type View = 'notes' | 'challenges';

interface HeaderProps {
  view: View;
  onViewChange: (view: View) => void;
}

export function Header({ view, onViewChange }: HeaderProps) {
  const { user, signOut } = useExtAuth();
  const { hasFeature } = useFeatures();
  const { language, setLanguage, t } = useLanguage();
  const [langOpen, setLangOpen] = useState(false);

  const avatarUrl = useGravatar(user?.email ?? undefined, 48);

  const tabs: { key: View; label: string }[] = [];
  if (hasFeature('notes')) tabs.push({ key: 'notes', label: t.sidebar.notes });
  if (hasFeature('challenges')) tabs.push({ key: 'challenges', label: t.sidebar.challenges });

  return (
    <div className="flex-shrink-0 border-b border-[#1c1928]">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3">
        <h1 className="text-lg font-semibold text-white tracking-tight">
          petek<span className="text-pink-500">.</span>
        </h1>
        <div className="flex items-center gap-2">
          <div className="relative">
            <button
              onClick={() => setLangOpen(!langOpen)}
              className="p-1.5 rounded-md text-[#7a7890] hover:text-white hover:bg-white/5 transition-colors"
            >
              <Globe size={14} />
            </button>
            {langOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setLangOpen(false)} />
                <div className="absolute right-0 top-full mt-1 z-20 bg-[#1e1b2e] border border-[#3a3650] rounded-lg shadow-xl py-1">
                  {(['en', 'ru', 'he', 'es'] as Language[]).map(lang => (
                    <button
                      key={lang}
                      onClick={() => { setLanguage(lang); setLangOpen(false); }}
                      className={`block w-full px-3 py-1.5 text-[12px] text-left transition-colors ${
                        language === lang ? 'text-[#ec4899]' : 'text-[#c0bfd0] hover:bg-white/[0.08]'
                      }`}
                    >
                      {lang.toUpperCase()}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
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
            title={t.sidebar.signOut}
          >
            <LogOut size={14} />
          </button>
        </div>
      </div>

      {/* Tabs — only show if more than 1 */}
      {tabs.length > 1 && (
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
      )}
    </div>
  );
}
