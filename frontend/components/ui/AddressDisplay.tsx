import { Copy, Check } from "lucide-react";
import { useState } from "react";
import { shortAddress } from "@/lib/formatters";
import { clsx } from "clsx";

interface AddressDisplayProps {
  address: string;
  className?: string;
  full?: boolean;
}

export function AddressDisplay({ address, className, full = false }: AddressDisplayProps) {
  const [copied, setCopied] = useState(false);

  function copy() {
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      onClick={copy}
      className={clsx(
        "inline-flex items-center gap-1.5 font-mono text-sm",
        "text-white/70 hover:text-white transition-colors",
        className
      )}
    >
      <span>{full ? address : shortAddress(address)}</span>
      {copied
        ? <Check className="w-3.5 h-3.5 text-bee-green" />
        : <Copy className="w-3.5 h-3.5 opacity-50" />
      }
    </button>
  );
}
