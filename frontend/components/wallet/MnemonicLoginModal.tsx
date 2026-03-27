"use client";
import { useState, useRef, useEffect } from "react";
import { useConnect } from "wagmi";
import { createMnemonicConnector } from "@/lib/mnemonicConnector";
import { Loader2, X, Eye, EyeOff } from "lucide-react";

interface Props {
  onClose: () => void;
}

function isValidMnemonic(words: string[]): boolean {
  return words.length === 12 || words.length === 24;
}

export function MnemonicLoginModal({ onClose }: Props) {
  const { connect } = useConnect();
  const [phrase, setPhrase] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPhrase, setShowPhrase] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  async function handleSubmit() {
    setError(null);
    const words = phrase.trim().toLowerCase().split(/\s+/);
    if (!isValidMnemonic(words)) {
      setError("Введите 12 или 24 слова через пробел");
      return;
    }

    setLoading(true);
    try {
      const connector = createMnemonicConnector(words.join(" "));
      await connect({ connector });
      onClose();
    } catch (e: any) {
      const msg: string = e?.message ?? "Неверная секретная фраза";
      if (msg.includes("Invalid mnemonic") || msg.includes("mnemonic")) {
        setError("Неверная секретная фраза. Проверьте слова.");
      } else {
        setError(msg.slice(0, 100));
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className="fixed z-50 left-1/2 -translate-x-1/2 bottom-6 w-[calc(100%-2rem)] max-w-sm rounded-3xl p-5 space-y-4"
        style={{
          background: "#10101e",
          border: "1px solid rgba(255,255,255,0.1)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <p className="text-white font-bold text-sm">
            🔑 Войти по секретной фразе
          </p>
          <button
            onClick={onClose}
            className="text-white/40 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Warning */}
        <div
          className="rounded-xl px-3 py-2.5 text-xs leading-relaxed"
          style={{
            background: "rgba(245,166,35,0.08)",
            border: "1px solid rgba(245,166,35,0.2)",
            color: "rgba(245,166,35,0.8)",
          }}
        >
          ⚠️ Никогда не вводите секретную фразу на сторонних сайтах.
          Фраза обрабатывается только локально в вашем браузере.
        </div>

        {/* Input */}
        <div className="relative">
          <textarea
            ref={textareaRef}
            value={phrase}
            onChange={(e) => {
              setPhrase(e.target.value);
              setError(null);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmit();
              }
            }}
            rows={4}
            placeholder="word1 word2 word3 ... (12 или 24 слова)"
            className="w-full rounded-xl px-4 py-3 text-sm text-white placeholder-white/25 resize-none outline-none pr-10"
            style={{
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)",
              fontFamily: showPhrase ? "inherit" : "text-security-disc",
              WebkitTextSecurity: showPhrase ? "none" : ("disc" as any),
            }}
            spellCheck={false}
            autoCorrect="off"
            autoCapitalize="none"
          />
          <button
            type="button"
            onClick={() => setShowPhrase(!showPhrase)}
            className="absolute top-3 right-3 text-white/30 hover:text-white/60 transition-colors"
          >
            {showPhrase ? (
              <EyeOff className="w-4 h-4" />
            ) : (
              <Eye className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Word count hint */}
        <p className="text-white/25 text-xs -mt-2">
          {phrase.trim()
            ? `${phrase.trim().split(/\s+/).filter(Boolean).length} слов`
            : "Вставьте фразу из MetaMask, Trust Wallet и др."}
        </p>

        {/* Error */}
        {error && (
          <p className="text-red-400 text-xs bg-red-500/10 rounded-xl px-3 py-2">
            {error}
          </p>
        )}

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={loading || !phrase.trim()}
          className="w-full py-3.5 rounded-2xl font-bold text-sm transition-all disabled:opacity-40"
          style={{
            background: "linear-gradient(135deg, #F5A623, #e8941a)",
            color: "#000",
          }}
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Подключение...
            </span>
          ) : (
            "Подключить кошелёк"
          )}
        </button>
      </div>
    </>
  );
}
