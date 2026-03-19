import { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import { Language, Translations } from './types';
import { en } from './en';
import { ru } from './ru';
import { he } from './he';
import { es } from './es';

const STORAGE_KEY = 'petek:language';

const translations: Record<Language, Translations> = { en, ru, he, es };

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: Translations;
  isRTL: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

function getInitialLanguage(): Language {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && stored in translations) return stored as Language;
  } catch { /* ignore */ }
  return 'en';
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(getInitialLanguage);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch { /* ignore */ }
  };

  const isRTL = language === 'he';

  useEffect(() => {
    document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  }, [language, isRTL]);

  const value = useMemo(() => ({ language, setLanguage, t: translations[language], isRTL }), [language]);

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used within LanguageProvider');
  return context;
}
