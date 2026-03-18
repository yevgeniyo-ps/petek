import { Settings } from 'lucide-react';
import Modal from '../ui/Modal';
import { useLanguage } from '../../i18n';

export interface MenuSettings {
  notes: boolean;
  insurances: boolean;
  subscriptions: boolean;
  challenges: boolean;
  collections: boolean;
}

export const defaultMenuSettings: MenuSettings = {
  notes: true,
  insurances: true,
  subscriptions: true,
  challenges: true,
  collections: true,
};

const STORAGE_KEY = 'petek:menu-settings';

export function loadMenuSettings(): MenuSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...defaultMenuSettings, ...JSON.parse(raw) };
  } catch { /* ignore */ }
  return { ...defaultMenuSettings };
}

export function saveMenuSettings(settings: MenuSettings) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

interface SettingsModalProps {
  open: boolean;
  onClose: () => void;
  settings: MenuSettings;
  onChange: (settings: MenuSettings) => void;
  enabledFeatures?: string[];
}

export default function SettingsModal({ open, onClose, settings, onChange, enabledFeatures }: SettingsModalProps) {
  const { t } = useLanguage();
  const toggle = (key: keyof MenuSettings) => {
    const next = { ...settings, [key]: !settings[key] };
    onChange(next);
    saveMenuSettings(next);
  };

  const allItems: { key: keyof MenuSettings; label: string }[] = [
    { key: 'notes', label: t.sidebar.notes },
    { key: 'insurances', label: t.sidebar.insurances },
    { key: 'subscriptions', label: t.sidebar.subscriptions },
    { key: 'challenges', label: t.sidebar.challenges },
    { key: 'collections', label: t.sidebar.collections },
  ];

  const items = enabledFeatures
    ? allItems.filter(item => enabledFeatures.includes(item.key))
    : allItems;

  return (
    <Modal open={open} onClose={onClose}>
      <div className="px-6 py-5">
        <div className="flex items-center gap-2.5 mb-5">
          <Settings size={18} className="text-[#ec4899]" />
          <h2 className="text-[16px] font-semibold text-white">{t.settings.title}</h2>
        </div>

        <div className="space-y-1">
          <span className="text-[11px] font-medium text-[#7a7890] uppercase tracking-wider">{t.settings.sidebarSections}</span>
          <div className="space-y-2 pt-2">
            {items.map(({ key, label }) => (
              <label key={key} className="flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-white/[0.04] cursor-pointer transition-colors">
                <span className="text-[14px] text-[#c0bfd0]">{label}</span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={settings[key]}
                  onClick={() => toggle(key)}
                  className={`relative w-9 h-5 rounded-full transition-colors ${
                    settings[key] ? 'bg-[#ec4899]' : 'bg-[#0c0a12]'
                  }`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                    settings[key] ? 'translate-x-4' : 'translate-x-0'
                  }`} />
                </button>
              </label>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
}
