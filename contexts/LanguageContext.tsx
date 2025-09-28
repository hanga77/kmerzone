import React, { createContext, useState, useContext, ReactNode, useCallback } from 'react';
import { translations } from '../translations';

type Language = 'fr' | 'en';

interface LanguageContextType {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: string, ...args: (string | number)[]) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const getNestedValue = (obj: any, path: string): string | undefined => {
  return path.split('.').reduce((acc, part) => acc && acc[part], obj);
};

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('fr');

  const t = useCallback((key: string, ...args: (string | number)[]): string => {
    const translation = getNestedValue(translations[language], key) || key;
    if (args.length > 0) {
      return translation.replace(/\{(\d+)\}/g, (match, index) => {
        return typeof args[index] !== 'undefined' ? String(args[index]) : match;
      });
    }
    return translation;
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
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
