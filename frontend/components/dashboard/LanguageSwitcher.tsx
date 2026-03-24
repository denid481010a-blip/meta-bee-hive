"use client";
import { useT } from "@/lib/i18n/LanguageContext";
import { LANGUAGES, type LangCode } from "@/lib/i18n/translations";

export function LanguageSwitcher() {
  const { lang, setLang } = useT();

  return (
    <div className="flex flex-wrap gap-2">
      {LANGUAGES.map((l) => (
        <button
          key={l.code}
          onClick={() => setLang(l.code as LangCode)}
          title={l.label}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium transition-all"
          style={
            lang === l.code
              ? { background: "rgba(245,166,35,0.15)", border: "1px solid rgba(245,166,35,0.35)", color: "#F5A623" }
              : { background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.4)" }
          }
        >
          <span>{l.flag}</span>
          <span>{l.code.toUpperCase()}</span>
        </button>
      ))}
    </div>
  );
}
