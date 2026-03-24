"use client";
import { useState } from "react";
import { Copy, Check, Share2 } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useT } from "@/lib/i18n/LanguageContext";

interface ReferralLinkProps {
  address: string;
}

export function ReferralLink({ address }: ReferralLinkProps) {
  const [copied, setCopied] = useState(false);
  const { t } = useT();
  const link = `${typeof window !== "undefined" ? window.location.origin : ""}/ref/${address}`;

  function copy() {
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  function share() {
    if (navigator.share) {
      navigator.share({ title: "BEE HIVE SYSTEM", text: t.referral.hint, url: link });
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
