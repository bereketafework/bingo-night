
import React, { createContext, useState, useContext, useMemo } from 'react';
import { Language } from '../types';
import { getTranslator, TranslationKey } from '../services/translations';

type LanguageContextType = {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKey, vars?: Record<string, any>) => string | React.ReactNode;
  t_str: (key: TranslationKey, vars?: Record<string, any>) => string;
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>(localStorage.getItem('bingo_language') as Language || 'en');

  const setLanguageWithStorage = (lang: Language) => {
    localStorage.setItem('bingo_language', lang);
    setLanguage(lang);
  };

  const { t, t_str } = useMemo(() => getTranslator(language), [language]);

  const value = { language, setLanguage: setLanguageWithStorage, t, t_str };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};