"use client";
import { useState } from "react";
import { Copy, Check, Share2 } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useT } from "@/lib/i18n/LanguageContext";

const TG_BOT = process.env.NEXT_PUBLIC_TG_BOT_NAME ?? "";

interface ReferralLinkProps {
  address: string;
}

export function ReferralLink({ address }: ReferralLinkProps) {
  const [copied, setCopied] = useState(false);
  const { t } = useT();

  const webLink = `${typeof window !== "undefined" ? window.location.origin : "https://meta-bee-hive.vercel.app"}/ref/${address}`;
  // Always use Telegram deep link when bot is configured
  const link = TG_BOT ? `https://t.me/${TG_BOT}?startapp=${address}` : webLink;

  function copy() {
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  function share() {
    const tg = (window as any).Telegram?.WebApp;
    if (tg) {
      // В Telegram — открываем шаринг через tg.openTelegramLink
      tg.openTelegramLink(`https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent("🐝 Присоединяйся к META BEE HIVE!")}`);
    } else if (navigator.share) {
      navigator.share({ title: "META BEE HIVE", text: t.referral.hint, url: link });
    } else {
      copy();
    }
  }

  return (
    <Card glow="gold">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xl">🔗</span>
        <h3 className="font-bold text-white">{t.referral.title}</h3>
      </div>
      <div className="bg-bg rounded-xl border border-gold/20 px-4 py-3 mb-4 flex items-center justify-between gap-3">
        <span className="text-white/60 text-sm truncate font-mono flex-1">{link}</span>
        <button onClick={copy} className="text-gold hover:text-white transition-colors flex-shrink-0">
          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
        </button>
      </div>
      <div className="flex gap-3">
        <Button variant="gold" size="sm" onClick={copy} className="flex-1 !text-white">
          {copied ? <><Check className="w-4 h-4" /> {t.referral.copied}</> : <><Copy className="w-4 h-4" /> {t.referral.copy}</>}
        </Button>
        <Button variant="navy" size="sm" onClick={share}>
          <Share2 className="w-4 h-4" />
        </Button>
      </div>
      <p className="text-xs text-white/30 mt-3 text-center">{t.referral.hint}</p>
    </Card>
  );
}
