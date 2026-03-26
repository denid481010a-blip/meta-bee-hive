"use client";
import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { translations, type LangCode, type Translations } from "./translations";

interface LanguageContextType {
  lang: LangCode;
  setLang: (lang: LangCode) => void;
  t: Translations;
}

const LanguageContext = createContext<LanguageContextType>({
  lang: "en",
  setLang: () => {},
  t: translations.en,
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<LangCode>("en");

  useEffect(() => {
    const saved = localStorage.getItem("lang") as LangCode | null;
    if (saved && translations[saved]) {
      setLangState(saved);
    } else {
      const browserLang = navigator.language.slice(0, 2) as LangCode;
      if (translations[browserLang]) setLangState(browserLang);
    }
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
