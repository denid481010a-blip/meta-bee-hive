"use client";
import { useT } from "@/lib/i18n/LanguageContext";
import { LANGUAGES } from "@/lib/i18n/translations";

export default function LanguagePage() {
  const { lang, setLang, t } = useT();

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">{t.language.title}</h1>
        <p className="text-white/40 text-sm mt-1">{t.language.subtitle}</p>
      </div>

      <div className="rounded-2xl overflow-hidden" style={{ background: "#10101e", border: "1px solid rgba(255,255,255,0.07)" }}>
        {LANGUAGES.map((l, i) => (
          <button
            key={l.code}
            onClick={() => setLang(l.code)}
            className="w-full flex items-center justify-between px-5 py-4 transition-colors hover:bg-white/[0.03]"
            style={{ borderBottom: i < LANGUAGES.length - 1 ? "1px solid rgba(255,255,255,0.05)" : undefined }}
          >
            <div className="flex items-center gap-4">
              <span className="text-2xl">{l.flag}</span>
              <p className="font-medium text-sm text-white text-left">{l.label}</p>
            </div>
            {lang === l.code && (
              <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ background: "#27AE60" }}>
                <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                  <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
