"use client";
import { useState } from "react";
import { Globe } from "lucide-react";

const LANGUAGES = [
  { code: "ru", label: "Русский",    flag: "🇷🇺", available: true  },
  { code: "en", label: "English",    flag: "🇬🇧", available: false },
  { code: "tr", label: "Türkçe",     flag: "🇹🇷", available: false },
  { code: "ar", label: "العربية",    flag: "🇸🇦", available: false },
  { code: "zh", label: "中文",        flag: "🇨🇳", available: false },
];

export default function LanguagePage() {
  const [selected, setSelected] = useState("ru");

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Язык</h1>
        <p className="text-white/40 text-sm mt-1">Выбери язык интерфейса</p>
      </div>

      <div className="rounded-2xl overflow-hidden" style={{ background: "#10101e", border: "1px solid rgba(255,255,255,0.07)" }}>
        {LANGUAGES.map((lang, i) => (
          <button
            key={lang.code}
            disabled={!lang.available}
            onClick={() => lang.available && setSelected(lang.code)}
            className="w-full flex items-center justify-between px-5 py-4 transition-colors hover:bg-white/[0.03] disabled:cursor-not-allowed"
            style={{ borderBottom: i < LANGUAGES.length - 1 ? "1px solid rgba(255,255,255,0.05)" : undefined }}
          >
            <div className="flex items-center gap-4">
              <span className="text-2xl">{lang.flag}</span>
              <div className="text-left">
                <p className={`font-medium text-sm ${lang.available ? "text-white" : "text-white/30"}`}>
                  {lang.label}
                </p>
                {!lang.available && (
                  <p className="text-white/20 text-xs">Скоро</p>
                )}
              </div>
            </div>
            {selected === lang.code && lang.available && (
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
