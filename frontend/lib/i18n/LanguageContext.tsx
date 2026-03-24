"use client";
import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { translations, type LangCode, type Translations } from "./translations";

interface LanguageContextType {
  lang: LangCode;
  setLang: (lang: LangCode) => void;
  t: Translations;
}

const LanguageContext = createContext<LanguageContextType>({
  lang: "ru",
  setLang: () => {},
  t: translations.ru,
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<LangCode>("ru");

  useEffect(() => {
    const saved = localStorage.getItem("lang") as LangCode | null;
    if (saved && translations[saved]) setLangState(saved);
  }, []);

  function setLang(l: LangCode) {
    setLangState(l);
    localStorage.setItem("lang", l);
  }

  return (
    <LanguageContext.Provider value={{ lang, setLang, t: translations[lang] }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useT() {
  return useContext(LanguageContext);
}
